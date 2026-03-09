import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";

vi.mock("nodemailer", () => ({
  default: {
    createTestAccount: vi.fn().mockResolvedValue({ user: "u", pass: "p" }),
    createTransport: vi.fn(),
    getTestMessageUrl: vi.fn().mockReturnValue("http://ethereal.example"),
  },
}));

const mockSendMail = vi.fn().mockResolvedValue({ messageId: "123" });
vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any);

beforeEach(() => vi.clearAllMocks());

import { sendEmail } from "../mailer";


describe("sendEmail", () => {
  it("sends to the correct recipient", async () => {
    await sendEmail({ to: "test@test.com", subject: "Hello", html: "<p>hi</p>" });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "test@test.com" })
    );
  });

  it("sends with correct subject and html", async () => {
    await sendEmail({ to: "a@b.com", subject: "Confirm", html: "<b>link</b>" });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Confirm", html: "<b>link</b>" })
    );
  });
});