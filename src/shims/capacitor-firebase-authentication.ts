// Web stub for @capacitor-firebase/authentication
export const FirebaseAuthentication = {
  signInWithGoogle: async () => {
    throw new Error("Native Google Sign In is not available on web.");
  },
  signInWithGithub: async () => {
    throw new Error("Native GitHub Sign In is not available on web.");
  },
  signOut: async () => {
    // no-op on web
  },
};
