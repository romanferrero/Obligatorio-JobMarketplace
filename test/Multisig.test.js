const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Multisig", function () {
  const Status = { Pending: 0, Executed: 1, Cancelled: 2 };

  // Despliega un multisig 2-of-3 con tres signers y un destinatario externo.
  async function deployFixture() {
    const [s1, s2, s3, outsider, recipient] = await ethers.getSigners();
    const signers = [s1.address, s2.address, s3.address];
    const threshold = 2;

    const Multisig = await ethers.getContractFactory("Multisig");
    const multisig = await Multisig.deploy(signers, threshold);
    await multisig.waitForDeployment();

    // Fondeamos el contrato con 10 ETH para poder ejecutar transferencias.
    await s1.sendTransaction({ to: await multisig.getAddress(), value: ethers.parseEther("10") });

    return { multisig, s1, s2, s3, outsider, recipient, signers, threshold };
  }

  describe("Despliegue", function () {
    it("guarda signers y threshold correctamente", async function () {
      const { multisig, signers, threshold } = await loadFixture(deployFixture);
      expect(await multisig.getSigners()).to.deep.equal(signers);
      expect(await multisig.threshold()).to.equal(threshold);
      expect(await multisig.signersCount()).to.equal(3);
    });

    it("marca cada signer en el mapping isSigner", async function () {
      const { multisig, s1, s2, s3, outsider } = await loadFixture(deployFixture);
      expect(await multisig.isSigner(s1.address)).to.equal(true);
      expect(await multisig.isSigner(s2.address)).to.equal(true);
      expect(await multisig.isSigner(s3.address)).to.equal(true);
      expect(await multisig.isSigner(outsider.address)).to.equal(false);
    });

    it("revierte con threshold inválido (0 o mayor a signers)", async function () {
      const [s1, s2] = await ethers.getSigners();
      const Multisig = await ethers.getContractFactory("Multisig");
      await expect(Multisig.deploy([s1.address, s2.address], 0)).to.be.revertedWithCustomError(
        Multisig,
        "InvalidThreshold"
      );
      await expect(Multisig.deploy([s1.address, s2.address], 3)).to.be.revertedWithCustomError(
        Multisig,
        "InvalidThreshold"
      );
    });

    it("revierte si hay signers duplicados", async function () {
      const [s1] = await ethers.getSigners();
      const Multisig = await ethers.getContractFactory("Multisig");
      await expect(Multisig.deploy([s1.address, s1.address], 1)).to.be.revertedWithCustomError(
        Multisig,
        "DuplicateSigner"
      );
    });

    it("revierte si no hay signers", async function () {
      const Multisig = await ethers.getContractFactory("Multisig");
      await expect(Multisig.deploy([], 1)).to.be.revertedWithCustomError(Multisig, "NoSigners");
    });
  });

  describe("Proponer", function () {
    it("un signer puede proponer y emite ProposalCreated", async function () {
      const { multisig, s1, recipient } = await loadFixture(deployFixture);
      const value = ethers.parseEther("1");
      await expect(multisig.connect(s1).propose(recipient.address, value, "0x"))
        .to.emit(multisig, "ProposalCreated")
        .withArgs(0, s1.address, recipient.address, value, "0x");

      expect(await multisig.proposalCount()).to.equal(1);
    });

    it("el proponente aprueba automáticamente su propia propuesta", async function () {
      const { multisig, s1, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      const p = await multisig.getProposal(0);
      expect(p.approvals).to.equal(1);
      expect(await multisig.hasApproved(0, s1.address)).to.equal(true);
    });

    it("rechaza propuestas de no-signers", async function () {
      const { multisig, outsider, recipient } = await loadFixture(deployFixture);
      await expect(
        multisig.connect(outsider).propose(recipient.address, 0, "0x")
      ).to.be.revertedWithCustomError(multisig, "NotSigner");
    });
  });

  describe("Aprobar", function () {
    it("acumula aprobaciones de distintos signers", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await expect(multisig.connect(s2).approve(0))
        .to.emit(multisig, "Approved")
        .withArgs(0, s2.address, 2);
      const p = await multisig.getProposal(0);
      expect(p.approvals).to.equal(2);
    });

    it("rechaza doble aprobación del mismo signer", async function () {
      const { multisig, s1, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x"); // ya aprobó al proponer
      await expect(multisig.connect(s1).approve(0)).to.be.revertedWithCustomError(
        multisig,
        "AlreadyApproved"
      );
    });

    it("rechaza aprobación de no-signer", async function () {
      const { multisig, s1, outsider, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await expect(multisig.connect(outsider).approve(0)).to.be.revertedWithCustomError(
        multisig,
        "NotSigner"
      );
    });

    it("rechaza aprobar una propuesta inexistente", async function () {
      const { multisig, s2 } = await loadFixture(deployFixture);
      await expect(multisig.connect(s2).approve(99)).to.be.revertedWithCustomError(
        multisig,
        "ProposalNotFound"
      );
    });
  });

  describe("Ejecutar", function () {
    it("ejecuta al alcanzar el threshold y transfiere ETH", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      const value = ethers.parseEther("2");
      await multisig.connect(s1).propose(recipient.address, value, "0x"); // approvals = 1
      await multisig.connect(s2).approve(0); // approvals = 2 == threshold

      await expect(multisig.connect(s1).execute(0)).to.changeEtherBalances(
        [multisig, recipient],
        [-value, value]
      );

      const p = await multisig.getProposal(0);
      expect(p.status).to.equal(Status.Executed);
    });

    it("emite Executed", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await multisig.connect(s2).approve(0);
      await expect(multisig.connect(s2).execute(0))
        .to.emit(multisig, "Executed")
        .withArgs(0, s2.address);
    });

    it("rechaza ejecución sin suficientes aprobaciones", async function () {
      const { multisig, s1, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x"); // solo 1 aprobación
      await expect(multisig.connect(s1).execute(0)).to.be.revertedWithCustomError(
        multisig,
        "NotEnoughApprovals"
      );
    });

    it("no se puede ejecutar dos veces", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await multisig.connect(s2).approve(0);
      await multisig.connect(s1).execute(0);
      await expect(multisig.connect(s1).execute(0)).to.be.revertedWithCustomError(
        multisig,
        "NotPending"
      );
    });

    it("rechaza ejecución de no-signer", async function () {
      const { multisig, s1, s2, outsider, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await multisig.connect(s2).approve(0);
      await expect(multisig.connect(outsider).execute(0)).to.be.revertedWithCustomError(
        multisig,
        "NotSigner"
      );
    });

    it("puede ejecutar calldata arbitraria sobre otro contrato", async function () {
      const { multisig, s1, s2 } = await loadFixture(deployFixture);
      // Desplegamos un contrato objetivo simple que recibe un setNumber(uint256).
      const Target = await ethers.getContractFactory("MockTarget");
      const target = await Target.deploy();
      await target.waitForDeployment();

      const data = target.interface.encodeFunctionData("setNumber", [42]);
      await multisig.connect(s1).propose(await target.getAddress(), 0, data);
      await multisig.connect(s2).approve(0);
      await multisig.connect(s1).execute(0);

      expect(await target.number()).to.equal(42);
    });
  });

  describe("Cancelar", function () {
    it("el proponente puede cancelar una propuesta pendiente", async function () {
      const { multisig, s1, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await expect(multisig.connect(s1).cancel(0))
        .to.emit(multisig, "Cancelled")
        .withArgs(0, s1.address);
      const p = await multisig.getProposal(0);
      expect(p.status).to.equal(Status.Cancelled);
    });

    it("un signer que no es el proponente no puede cancelar", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await expect(multisig.connect(s2).cancel(0)).to.be.revertedWithCustomError(
        multisig,
        "NotProposer"
      );
    });

    it("no se puede cancelar una propuesta ya ejecutada", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await multisig.connect(s2).approve(0);
      await multisig.connect(s1).execute(0);
      await expect(multisig.connect(s1).cancel(0)).to.be.revertedWithCustomError(
        multisig,
        "NotPending"
      );
    });

    it("no se puede aprobar una propuesta cancelada", async function () {
      const { multisig, s1, s2, recipient } = await loadFixture(deployFixture);
      await multisig.connect(s1).propose(recipient.address, 0, "0x");
      await multisig.connect(s1).cancel(0);
      await expect(multisig.connect(s2).approve(0)).to.be.revertedWithCustomError(
        multisig,
        "NotPending"
      );
    });
  });
});
