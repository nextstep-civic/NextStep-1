
import {
  doc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function usernameBase(name) {
  const cleaned = String(name || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  return cleaned.length >= 3
    ? cleaned
    : "member";
}

function candidateUsername(base, attempt) {
  if (attempt === 0) return base;

  const random = crypto.getRandomValues(
    new Uint32Array(1)
  )[0] % 9000 + 1000;

  return base.slice(0, 16) + random;
}

export async function ensureUsername(
  db,
  firebaseUser,
  preferredName = ""
) {
  if (!firebaseUser) {
    throw new Error("You must be signed in.");
  }

  const uid = firebaseUser.uid;
  const userRef = doc(db, "users", uid);

  const name =
    preferredName ||
    firebaseUser.displayName ||
    "member";

  const base = usernameBase(name);

  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = candidateUsername(
      base,
      attempt
    );

    const reservationRef = doc(
      db,
      "usernames",
      candidate
    );

    const result = await runTransaction(
      db,
      async transaction => {
        const profile = await transaction.get(userRef);
        const reservation = await transaction.get(
          reservationRef
        );

        // Preserve usernames that already exist.
        const existing = profile.exists()
          ? profile.data().username
          : null;

        if (
          typeof existing === "string" &&
          existing.trim() !== ""
        ) {
          return {
            status: "existing",
            username: existing
          };
        }

        // Another member already owns this name.
        if (reservation.exists()) {
          return { status: "taken" };
        }

        // These two changes commit together.
        transaction.set(reservationRef, {
          uid,
          username: candidate,
          createdAt: serverTimestamp()
        });

        transaction.set(
          userRef,
          { username: candidate },
          { merge: true }
        );

        return {
          status: "created",
          username: candidate
        };
      }
    );

    if (result.status !== "taken") {
      return result.username;
    }
  }

  throw new Error(
    "Couldn't assign a username. Please try again."
  );
}
