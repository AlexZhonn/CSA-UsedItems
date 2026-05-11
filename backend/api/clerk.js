import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

async function getUserId(request) {
  // Use the `request.auth` object to access `isAuthenticated` and the user's ID
  const { isAuthenticated, userId } = request.auth;

  // If user isn't authenticated, return null
  if (!isAuthenticated) {
    return null;
  }

  // Use the Backend SDK's `getUser()` method to get the Backend User object
  const user = await clerkClient.users.getUser(userId);

  // Return the Backend User object
  return user;
}
