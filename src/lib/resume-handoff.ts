// A resume picked on the landing page, handed to /analyze across a client-side navigation.
// Module state survives client routing; a full reload simply starts the upload step empty.
let pending: File | null = null;

export function handOffResume(file: File) {
  pending = file;
}

export function peekHandedOffResume(): File | null {
  return pending;
}

export function clearHandedOffResume() {
  pending = null;
}
