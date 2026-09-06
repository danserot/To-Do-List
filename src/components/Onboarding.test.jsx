import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Onboarding, { onboardingKeyFor } from "./Onboarding";

describe("Onboarding", () => {
  const user = { id: "new-user" };

  beforeEach(() => localStorage.clear());

  it("creates selected starter tasks and remembers completion", async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    render(<Onboarding user={user} taskCount={0} onCreate={onCreate} />);

    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Настроить первые задачи/i }));
    fireEvent.click(screen.getByRole("button", { name: "Готово" }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(2));
    expect(localStorage.getItem(onboardingKeyFor(user))).toBe("done");
  });
});
