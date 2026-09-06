import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuickAdd from "./QuickAdd";

describe("QuickAdd workflow", () => {
  it("submits Russian natural input with date, time, repeat rule and tags", async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    render(<QuickAdd onAdd={onAdd} />);

    const input = screen.getByLabelText("Новая задача");
    await userEvent.type(input, "Позвонить завтра в 18:00 каждый день #дом");
    await userEvent.click(screen.getByRole("button", { name: /^Добавить$/i }));

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1));
    expect(onAdd.mock.calls[0][0]).toMatchObject({
      text: "Позвонить",
      dueTime: "18:00",
      recurrence: "daily",
      tags: ["дом"],
    });
  });
});
