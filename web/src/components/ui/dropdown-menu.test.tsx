import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

vi.mock("radix-ui", () => ({
  DropdownMenu: {
    Root: ({ children, ...props }: any) => <div data-testid="dropdown-menu-root" {...props}>{children}</div>,
    Portal: ({ children, ...props }: any) => <div data-testid="dropdown-menu-portal" {...props}>{children}</div>,
    Trigger: ({ children, ...props }: any) => <button data-testid="dropdown-menu-trigger" {...props}>{children}</button>,
    Content: ({ children, ...props }: any) => <div data-testid="dropdown-menu-content" {...props}>{children}</div>,
    Group: ({ children, ...props }: any) => <div data-testid="dropdown-menu-group" {...props}>{children}</div>,
    Item: ({ children, ...props }: any) => <div data-testid="dropdown-menu-item" {...props}>{children}</div>,
    CheckboxItem: ({ children, ...props }: any) => <div data-testid="dropdown-menu-checkbox-item" {...props}>{children}</div>,
    RadioGroup: ({ children, ...props }: any) => <div data-testid="dropdown-menu-radio-group" {...props}>{children}</div>,
    RadioItem: ({ children, ...props }: any) => <div data-testid="dropdown-menu-radio-item" {...props}>{children}</div>,
    Label: ({ children, ...props }: any) => <label data-testid="dropdown-menu-label" {...props}>{children}</label>,
    Separator: (props: any) => <hr data-testid="dropdown-menu-separator" {...props} />,
    Sub: ({ children, ...props }: any) => <div data-testid="dropdown-menu-sub" {...props}>{children}</div>,
    SubTrigger: ({ children, ...props }: any) => <button data-testid="dropdown-menu-sub-trigger" {...props}>{children}</button>,
    SubContent: ({ children, ...props }: any) => <div data-testid="dropdown-menu-sub-content" {...props}>{children}</div>,
    ItemIndicator: ({ children, ...props }: any) => <span data-testid="dropdown-menu-item-indicator" {...props}>{children}</span>,
  },
}));

vi.mock("lucide-react", () => ({
  CheckIcon: () => <svg data-testid="check-icon" />,
  ChevronRightIcon: () => <svg data-testid="chevron-right-icon" />,
  CircleIcon: () => <svg data-testid="circle-icon" />,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}));

import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu";

describe("dropdown-menu components", () => {
  test("DropdownMenu renders with props", () => {
    render(<DropdownMenu open><div>content</div></DropdownMenu>);
    expect(screen.getByTestId("dropdown-menu-root")).toBeInTheDocument();
  });

  test("DropdownMenuPortal renders with props", () => {
    render(<DropdownMenuPortal><div>content</div></DropdownMenuPortal>);
    expect(screen.getByTestId("dropdown-menu-portal")).toBeInTheDocument();
  });

  test("DropdownMenuTrigger renders with props", () => {
    render(<DropdownMenuTrigger>Trigger</DropdownMenuTrigger>);
    expect(screen.getByTestId("dropdown-menu-trigger")).toHaveTextContent("Trigger");
  });

  test("DropdownMenuContent renders with default classes", () => {
    render(<DropdownMenuContent>Content</DropdownMenuContent>);
    const content = screen.getByTestId("dropdown-menu-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("z-50");
  });

  test("DropdownMenuGroup renders with props", () => {
    render(<DropdownMenuGroup><div>group</div></DropdownMenuGroup>);
    expect(screen.getByTestId("dropdown-menu-group")).toBeInTheDocument();
  });

  test("DropdownMenuItem renders with default variant", () => {
    render(<DropdownMenuItem>Item</DropdownMenuItem>);
    const item = screen.getByTestId("dropdown-menu-item");
    expect(item).toBeInTheDocument();
    expect(item).toHaveAttribute("data-variant", "default");
  });

  test("DropdownMenuItem renders with destructive variant", () => {
    render(<DropdownMenuItem variant="destructive">Item</DropdownMenuItem>);
    const item = screen.getByTestId("dropdown-menu-item");
    expect(item).toHaveAttribute("data-variant", "destructive");
  });

  test("DropdownMenuCheckboxItem renders with checked state", () => {
    render(<DropdownMenuCheckboxItem checked>Checkbox</DropdownMenuCheckboxItem>);
    const item = screen.getByTestId("dropdown-menu-checkbox-item");
    expect(item).toBeInTheDocument();
    expect(screen.getByTestId("check-icon")).toBeInTheDocument();
  });

  test("DropdownMenuRadioGroup renders with props", () => {
    render(<DropdownMenuRadioGroup><div>radio</div></DropdownMenuRadioGroup>);
    expect(screen.getByTestId("dropdown-menu-radio-group")).toBeInTheDocument();
  });

  test("DropdownMenuRadioItem renders with indicator", () => {
    render(<DropdownMenuRadioItem>Radio</DropdownMenuRadioItem>);
    const item = screen.getByTestId("dropdown-menu-radio-item");
    expect(item).toBeInTheDocument();
    expect(screen.getByTestId("circle-icon")).toBeInTheDocument();
  });

  test("DropdownMenuLabel renders with props", () => {
    render(<DropdownMenuLabel>Label</DropdownMenuLabel>);
    expect(screen.getByTestId("dropdown-menu-label")).toHaveTextContent("Label");
  });

  test("DropdownMenuSeparator renders", () => {
    render(<DropdownMenuSeparator />);
    expect(screen.getByTestId("dropdown-menu-separator")).toBeInTheDocument();
  });

  test("DropdownMenuShortcut renders with text", () => {
    render(<DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>);
    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
  });

  test("DropdownMenuSub renders with props", () => {
    render(<DropdownMenuSub><div>sub</div></DropdownMenuSub>);
    expect(screen.getByTestId("dropdown-menu-sub")).toBeInTheDocument();
  });

  test("DropdownMenuSubTrigger renders with chevron", () => {
    render(<DropdownMenuSubTrigger>Sub Trigger</DropdownMenuSubTrigger>);
    const trigger = screen.getByTestId("dropdown-menu-sub-trigger");
    expect(trigger).toBeInTheDocument();
    expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
  });

  test("DropdownMenuSubContent renders with classes", () => {
    render(<DropdownMenuSubContent>Sub Content</DropdownMenuSubContent>);
    const content = screen.getByTestId("dropdown-menu-sub-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("z-50");
  });
});
