import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SignInPage from "../../app/(auth)/sign-in";
import { AuthContext } from "../../context/AuthContext";

const mockLogin = jest.fn();
const mockRouter = { replace: jest.fn() };

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  Link: ({ children }) => children,
}));

function renderWithAuth(ui, contextValue = {}) {
  const defaultContext = {
    isLoaded: true,
    isSignedIn: false,
    user: null,
    login: mockLogin,
    logout: jest.fn(),
    register: jest.fn(),
    verifyEmail: jest.fn(),
    updateUser: jest.fn(),
    ...contextValue,
  };
  return render(
    <AuthContext.Provider value={defaultContext}>{ui}</AuthContext.Provider>
  );
}

describe("SignInPage", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockRouter.replace.mockReset();
  });

  it("renders email and password inputs", () => {
    const { getByPlaceholderText } = renderWithAuth(<SignInPage />);
    expect(getByPlaceholderText("you@example.com")).toBeTruthy();
    expect(getByPlaceholderText("Enter your password")).toBeTruthy();
  });

  it("calls login with email and password on submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const { getByPlaceholderText, getByText } = renderWithAuth(<SignInPage />);
    fireEvent.changeText(getByPlaceholderText("you@example.com"), "test@csa.org");
    fireEvent.changeText(getByPlaceholderText("Enter your password"), "secret123");
    fireEvent.press(getByText("Sign In"));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@csa.org", "secret123");
    });
  });
});
