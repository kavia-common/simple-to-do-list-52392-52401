import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders todo app header and input", () => {
  render(<App />);
  expect(screen.getByText(/todo list/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/what do you need to do/i)).toBeInTheDocument();
});
