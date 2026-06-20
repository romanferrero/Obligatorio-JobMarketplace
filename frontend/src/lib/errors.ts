import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

const ERROR_MESSAGES_ES: Record<string, string> = {
  JobNotFound: "No se encontró el trabajo.",
  NotClient: "Esta acción es solo para el cliente del trabajo.",
  NotProvider: "Esta acción es solo para el proveedor asignado.",
  NotEvaluator: "Esta acción es solo para el evaluador del trabajo.",
  InvalidState: "El trabajo no está en un estado válido para esta acción.",
  ProviderAlreadySet: "Este trabajo ya tiene un proveedor asignado.",
  ProviderNotSet: "Hay que asignar un proveedor antes de fondear.",
  ZeroAddress: "La dirección no puede ser la dirección cero.",
  ZeroBudget: "El presupuesto debe ser mayor a cero.",
  BadExpiry: "La fecha de expiración debe ser en el futuro.",
  NotExpired: "El trabajo todavía no venció.",
  ReentrancyGuardReentrantCall: "Error interno de seguridad (reentrancy). Intentá de nuevo.",
  SafeERC20FailedOperation: "Falló la operación con el token. Revisá tu balance y el allowance aprobado.",
  NotSigner: "Esta acción es solo para firmantes del Multisig.",
  InvalidThreshold: "El threshold elegido no es válido para esa cantidad de firmantes.",
  DuplicateSigner: "Ese firmante ya está en la lista.",
  NoSigners: "El Multisig necesita al menos un firmante.",
  ProposalNotFound: "No se encontró la propuesta.",
  NotPending: "La propuesta ya no está pendiente.",
  AlreadyApproved: "Ya aprobaste esta propuesta.",
  NotEnoughApprovals: "Todavía no se alcanzó el threshold de aprobaciones.",
  NotProposer: "Esta acción es solo para quien creó la propuesta.",
  ExecutionFailed: "La ejecución de la propuesta falló.",
  Reentrancy: "Error interno de seguridad (reentrancy). Intentá de nuevo.",
};

export function decodeError(error: unknown): string {
  if (error instanceof BaseError) {
    const revertError = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;
      if (errorName && errorName in ERROR_MESSAGES_ES) {
        return ERROR_MESSAGES_ES[errorName] ?? error.shortMessage;
      }
    }

    const rejectionError = error.walk((e) => e instanceof UserRejectedRequestError);
    if (rejectionError) {
      return "Rechazaste la transacción en la wallet.";
    }

    return error.shortMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}
