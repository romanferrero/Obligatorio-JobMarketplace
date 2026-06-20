// El contenido de la entrega vive solo en localStorage: on-chain únicamente se
// guarda `deliverableRef` (un hash). El evaluador tiene que estar en el mismo
// navegador que el proveedor para poder leer el contenido — limitación aceptada
// y documentada para esta entrega (alternativas: base de datos o IPFS, fuera de
// alcance acá).
const PREFIX = "jobmarketplace:deliverable:";

function keyFor(ref: `0x${string}`): string {
  return `${PREFIX}${ref.toLowerCase()}`;
}

export function saveDeliverable(ref: `0x${string}`, content: string): void {
  localStorage.setItem(keyFor(ref), content);
}

export function getDeliverable(ref: `0x${string}`): string | null {
  return localStorage.getItem(keyFor(ref));
}

export function hasDeliverable(ref: `0x${string}`): boolean {
  return localStorage.getItem(keyFor(ref)) !== null;
}
