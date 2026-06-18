const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("JobMarketplace", function () {
  const Status = {
    Open: 0,
    Funded: 1,
    Submitted: 2,
    Completed: 3,
    Rejected: 4,
    Expired: 5,
  };

  const BUDGET = ethers.parseEther("100");
  const REASON = ethers.id("ok"); // bytes32 de atestación
  const DELIVERABLE = ethers.id("entregable"); // bytes32 de ejemplo

  // Despliega token + marketplace; mintea al cliente y aprueba el allowance del budget.
  async function deployFixture() {
    const [deployer, client, provider, evaluator, outsider] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockERC20");
    const token = await Token.deploy("Mock USD", "mUSD");
    await token.waitForDeployment();

    const Marketplace = await ethers.getContractFactory("JobMarketplace");
    const marketplace = await Marketplace.deploy(await token.getAddress());
    await marketplace.waitForDeployment();

    await token.mint(client.address, ethers.parseEther("1000"));
    await token
      .connect(client)
      .approve(await marketplace.getAddress(), ethers.MaxUint256);

    return { token, marketplace, deployer, client, provider, evaluator, outsider };
  }

  // Crea un trabajo Open con proveedor ya asignado. Devuelve jobId y expiresAt.
  async function createOpenJob(marketplace, client, provider, evaluator) {
    const expiresAt = (await time.latest()) + 3600;
    await marketplace
      .connect(client)
      .createJob("Construir landing", BUDGET, evaluator.address, provider.address, expiresAt);
    const jobId = (await marketplace.jobsCount()) - 1n;
    return { jobId, expiresAt };
  }

  // Crea y fondea un trabajo (estado Funded).
  async function createFundedJob(marketplace, client, provider, evaluator) {
    const { jobId, expiresAt } = await createOpenJob(marketplace, client, provider, evaluator);
    await marketplace.connect(client).fund(jobId);
    return { jobId, expiresAt };
  }

  describe("Despliegue", function () {
    it("fija el token de pago en el constructor", async function () {
      const { marketplace, token } = await loadFixture(deployFixture);
      expect(await marketplace.token()).to.equal(await token.getAddress());
    });

    it("revierte si el token es address(0)", async function () {
      const Marketplace = await ethers.getContractFactory("JobMarketplace");
      await expect(Marketplace.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        Marketplace,
        "ZeroAddress"
      );
    });
  });

  describe("createJob", function () {
    it("crea un trabajo Open y emite JobCreated", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const expiresAt = (await time.latest()) + 3600;

      await expect(
        marketplace
          .connect(client)
          .createJob("Construir landing", BUDGET, evaluator.address, provider.address, expiresAt)
      )
        .to.emit(marketplace, "JobCreated")
        .withArgs(
          0,
          client.address,
          evaluator.address,
          provider.address,
          BUDGET,
          expiresAt,
          "Construir landing"
        );

      const job = await marketplace.getJob(0);
      expect(job.client).to.equal(client.address);
      expect(job.provider).to.equal(provider.address);
      expect(job.evaluator).to.equal(evaluator.address);
      expect(job.budget).to.equal(BUDGET);
      expect(job.status).to.equal(Status.Open);
    });

    it("permite proveedor opcional (address(0))", async function () {
      const { marketplace, client, evaluator } = await loadFixture(deployFixture);
      const expiresAt = (await time.latest()) + 3600;
      await marketplace
        .connect(client)
        .createJob("Sin proveedor aún", BUDGET, evaluator.address, ethers.ZeroAddress, expiresAt);
      const job = await marketplace.getJob(0);
      expect(job.provider).to.equal(ethers.ZeroAddress);
    });

    it("revierte si el evaluador es address(0)", async function () {
      const { marketplace, client, provider } = await loadFixture(deployFixture);
      const expiresAt = (await time.latest()) + 3600;
      await expect(
        marketplace
          .connect(client)
          .createJob("x", BUDGET, ethers.ZeroAddress, provider.address, expiresAt)
      ).to.be.revertedWithCustomError(marketplace, "ZeroAddress");
    });

    it("revierte si el budget es 0", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const expiresAt = (await time.latest()) + 3600;
      await expect(
        marketplace
          .connect(client)
          .createJob("x", 0, evaluator.address, provider.address, expiresAt)
      ).to.be.revertedWithCustomError(marketplace, "ZeroBudget");
    });

    it("revierte si expiresAt no es futuro", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const past = await time.latest();
      await expect(
        marketplace
          .connect(client)
          .createJob("x", BUDGET, evaluator.address, provider.address, past)
      ).to.be.revertedWithCustomError(marketplace, "BadExpiry");
    });

    it("revierte getJob de un jobId inexistente", async function () {
      const { marketplace } = await loadFixture(deployFixture);
      await expect(marketplace.getJob(0)).to.be.revertedWithCustomError(
        marketplace,
        "JobNotFound"
      );
    });
  });

  describe("setProvider", function () {
    it("el cliente asigna proveedor a un trabajo Open sin proveedor", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const expiresAt = (await time.latest()) + 3600;
      await marketplace
        .connect(client)
        .createJob("x", BUDGET, evaluator.address, ethers.ZeroAddress, expiresAt);

      await expect(marketplace.connect(client).setProvider(0, provider.address))
        .to.emit(marketplace, "ProviderSet")
        .withArgs(0, provider.address);
      expect((await marketplace.getJob(0)).provider).to.equal(provider.address);
    });

    it("revierte si lo llama alguien que no es el cliente", async function () {
      const { marketplace, client, provider, evaluator, outsider } = await loadFixture(
        deployFixture
      );
      const expiresAt = (await time.latest()) + 3600;
      await marketplace
        .connect(client)
        .createJob("x", BUDGET, evaluator.address, ethers.ZeroAddress, expiresAt);
      await expect(
        marketplace.connect(outsider).setProvider(0, provider.address)
      ).to.be.revertedWithCustomError(marketplace, "NotClient");
    });

    it("revierte si el proveedor ya estaba asignado", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      await createOpenJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(client).setProvider(0, provider.address)
      ).to.be.revertedWithCustomError(marketplace, "ProviderAlreadySet");
    });

    it("revierte si el trabajo no está Open", async function () {
      const { marketplace, client, provider, evaluator, outsider } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(client).setProvider(jobId, outsider.address)
      ).to.be.revertedWithCustomError(marketplace, "InvalidState");
    });
  });

  describe("fund", function () {
    it("transfiere el budget al escrow y pasa a Funded", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(marketplace, client, provider, evaluator);

      const tx = marketplace.connect(client).fund(jobId);
      await expect(tx).to.emit(marketplace, "JobFunded").withArgs(jobId, BUDGET);
      await expect(tx).to.changeTokenBalances(token, [client, marketplace], [-BUDGET, BUDGET]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Funded);
    });

    it("revierte si no lo llama el cliente", async function () {
      const { marketplace, client, provider, evaluator, outsider } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createOpenJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(outsider).fund(jobId)
      ).to.be.revertedWithCustomError(marketplace, "NotClient");
    });

    it("revierte si el trabajo no tiene proveedor asignado", async function () {
      const { marketplace, client, evaluator } = await loadFixture(deployFixture);
      const expiresAt = (await time.latest()) + 3600;
      await marketplace
        .connect(client)
        .createJob("x", BUDGET, evaluator.address, ethers.ZeroAddress, expiresAt);
      await expect(marketplace.connect(client).fund(0)).to.be.revertedWithCustomError(
        marketplace,
        "ProviderNotSet"
      );
    });

    it("revierte al fondear dos veces (estado inválido)", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await expect(marketplace.connect(client).fund(jobId)).to.be.revertedWithCustomError(
        marketplace,
        "InvalidState"
      );
    });
  });

  describe("submit", function () {
    it("el proveedor entrega y pasa a Submitted", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);

      await expect(marketplace.connect(provider).submit(jobId, DELIVERABLE))
        .to.emit(marketplace, "JobSubmitted")
        .withArgs(jobId, DELIVERABLE);
      const job = await marketplace.getJob(jobId);
      expect(job.status).to.equal(Status.Submitted);
      expect(job.deliverableRef).to.equal(DELIVERABLE);
    });

    it("revierte si no lo llama el proveedor", async function () {
      const { marketplace, client, provider, evaluator, outsider } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(outsider).submit(jobId, DELIVERABLE)
      ).to.be.revertedWithCustomError(marketplace, "NotProvider");
    });

    it("revierte si el trabajo no está Funded", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(provider).submit(jobId, DELIVERABLE)
      ).to.be.revertedWithCustomError(marketplace, "InvalidState");
    });
  });

  describe("Happy path: crear → fondear → entregar → completar", function () {
    it("libera el pago al proveedor al completar", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      const tx = marketplace.connect(evaluator).complete(jobId, REASON);
      await expect(tx).to.emit(marketplace, "JobCompleted").withArgs(jobId, REASON);
      await expect(tx).to.changeTokenBalances(token, [marketplace, provider], [-BUDGET, BUDGET]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Completed);
    });

    it("complete revierte si no lo llama el evaluador", async function () {
      const { marketplace, client, provider, evaluator, outsider } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);
      await expect(
        marketplace.connect(outsider).complete(jobId, REASON)
      ).to.be.revertedWithCustomError(marketplace, "NotEvaluator");
    });

    it("complete revierte si el trabajo no está Submitted", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(evaluator).complete(jobId, REASON)
      ).to.be.revertedWithCustomError(marketplace, "InvalidState");
    });
  });

  describe("reject", function () {
    it("el cliente rechaza en Open (sin fondos que mover)", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createOpenJob(marketplace, client, provider, evaluator);

      const tx = marketplace.connect(client).reject(jobId, REASON);
      await expect(tx).to.emit(marketplace, "JobRejected").withArgs(jobId, REASON);
      await expect(tx).to.changeTokenBalances(token, [marketplace, client], [0, 0]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Rejected);
    });

    it("el evaluador rechaza en Funded y reembolsa al cliente", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);

      const tx = marketplace.connect(evaluator).reject(jobId, REASON);
      await expect(tx).to.emit(marketplace, "JobRejected").withArgs(jobId, REASON);
      await expect(tx).to.changeTokenBalances(token, [marketplace, client], [-BUDGET, BUDGET]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Rejected);
    });

    it("el evaluador rechaza en Submitted y reembolsa al cliente", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(
        deployFixture
      );
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      const tx = marketplace.connect(evaluator).reject(jobId, REASON);
      await expect(tx).to.emit(marketplace, "JobRejected").withArgs(jobId, REASON);
      await expect(tx).to.changeTokenBalances(token, [marketplace, client], [-BUDGET, BUDGET]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Rejected);
    });

    it("revierte si un no-cliente intenta rechazar en Open", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createOpenJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(evaluator).reject(jobId, REASON)
      ).to.be.revertedWithCustomError(marketplace, "NotClient");
    });

    it("revierte si un no-evaluador intenta rechazar en Funded", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await expect(
        marketplace.connect(client).reject(jobId, REASON)
      ).to.be.revertedWithCustomError(marketplace, "NotEvaluator");
    });

    it("revierte si el trabajo está en estado terminal", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);
      await marketplace.connect(evaluator).complete(jobId, REASON);
      await expect(
        marketplace.connect(evaluator).reject(jobId, REASON)
      ).to.be.revertedWithCustomError(marketplace, "InvalidState");
    });
  });

  describe("claimRefund (expiración)", function () {
    it("reembolsa al cliente desde Funded después de expirar", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(
        deployFixture
      );
      const { jobId, expiresAt } = await createFundedJob(marketplace, client, provider, evaluator);
      await time.increaseTo(expiresAt + 1);

      const tx = marketplace.connect(provider).claimRefund(jobId);
      await expect(tx).to.emit(marketplace, "JobExpired").withArgs(jobId);
      await expect(tx).to.changeTokenBalances(token, [marketplace, client], [-BUDGET, BUDGET]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Expired);
    });

    it("reembolsa al cliente desde Submitted después de expirar", async function () {
      const { marketplace, token, client, provider, evaluator } = await loadFixture(
        deployFixture
      );
      const { jobId, expiresAt } = await createFundedJob(marketplace, client, provider, evaluator);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);
      await time.increaseTo(expiresAt + 1);

      const tx = marketplace.connect(client).claimRefund(jobId);
      await expect(tx).to.emit(marketplace, "JobExpired").withArgs(jobId);
      await expect(tx).to.changeTokenBalances(token, [marketplace, client], [-BUDGET, BUDGET]);
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Expired);
    });

    it("cualquiera puede reclamar el reembolso (sin control de acceso)", async function () {
      const { marketplace, token, client, provider, evaluator, outsider } = await loadFixture(
        deployFixture
      );
      const { jobId, expiresAt } = await createFundedJob(marketplace, client, provider, evaluator);
      await time.increaseTo(expiresAt + 1);

      await expect(
        marketplace.connect(outsider).claimRefund(jobId)
      ).to.changeTokenBalances(token, [marketplace, client], [-BUDGET, BUDGET]);
    });

    it("revierte si todavía no expiró", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId } = await createFundedJob(marketplace, client, provider, evaluator);
      await expect(marketplace.connect(client).claimRefund(jobId)).to.be.revertedWithCustomError(
        marketplace,
        "NotExpired"
      );
    });

    it("revierte si el trabajo no está Funded/Submitted", async function () {
      const { marketplace, client, provider, evaluator } = await loadFixture(deployFixture);
      const { jobId, expiresAt } = await createOpenJob(marketplace, client, provider, evaluator);
      await time.increaseTo(expiresAt + 1);
      await expect(marketplace.connect(client).claimRefund(jobId)).to.be.revertedWithCustomError(
        marketplace,
        "InvalidState"
      );
    });
  });

  describe("Multisig como evaluador", function () {
    it("complete solo tiene éxito tras alcanzar el threshold y ejecutar el llamado", async function () {
      const { token, marketplace, client, provider } = await loadFixture(deployFixture);
      const [, , , , , s1, s2, s3] = await ethers.getSigners();

      // 1) Multisig 2-de-3 como evaluador.
      const Multisig = await ethers.getContractFactory("Multisig");
      const multisig = await Multisig.deploy([s1.address, s2.address, s3.address], 2);
      await multisig.waitForDeployment();
      const multisigAddr = await multisig.getAddress();

      // 2) Trabajo con evaluator = multisig, fondeado y entregado.
      const expiresAt = (await time.latest()) + 3600;
      await marketplace
        .connect(client)
        .createJob("Trabajo con multisig", BUDGET, multisigAddr, provider.address, expiresAt);
      const jobId = (await marketplace.jobsCount()) - 1n;
      await marketplace.connect(client).fund(jobId);
      await marketplace.connect(provider).submit(jobId, DELIVERABLE);

      // Un signer NO puede completar directamente: el evaluador es el contrato.
      await expect(
        marketplace.connect(s1).complete(jobId, REASON)
      ).to.be.revertedWithCustomError(marketplace, "NotEvaluator");

      // 3) Se propone el llamado a complete desde el multisig (1 aprobación).
      const calldata = marketplace.interface.encodeFunctionData("complete", [jobId, REASON]);
      await multisig.connect(s1).propose(await marketplace.getAddress(), 0, calldata);
      const proposalId = (await multisig.proposalCount()) - 1n;

      // Con una sola firma no alcanza el threshold: el trabajo sigue Submitted.
      await expect(multisig.connect(s1).execute(proposalId)).to.be.revertedWithCustomError(
        multisig,
        "NotEnoughApprovals"
      );
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Submitted);

      // 4) Segunda firma alcanza el threshold y la ejecución libera el pago.
      await multisig.connect(s2).approve(proposalId);
      await expect(multisig.connect(s1).execute(proposalId)).to.changeTokenBalances(
        token,
        [marketplace, provider],
        [-BUDGET, BUDGET]
      );
      expect((await marketplace.getJob(jobId)).status).to.equal(Status.Completed);
    });
  });
});
