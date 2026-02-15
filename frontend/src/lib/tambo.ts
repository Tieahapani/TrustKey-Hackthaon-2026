/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * Registers UI components that Tambo AI can render inside the chat.
 * When a user asks to apply for a listing, Tambo will render the
 * ApplicationForm component instead of a text response.
 */

import { z } from "zod/v4";
import type { TamboComponent } from "@tambo-ai/react";
import ApplicationForm from "../components/tambo/ApplicationForm";

export const components: TamboComponent[] = [
  {
    name: "ApplicationForm",
    description:
      "Renders an application form for a buyer to apply to a property listing. Use this component whenever a user wants to apply, submit an application, or sign up for a listing. The form collects: last name, first name, date of birth, and email. It then runs a soft credit check via CRS Credit API.",
    component: ApplicationForm,
    propsSchema: z.object({
      listingId: z.string().describe("The MongoDB _id of the listing the user wants to apply to"),
      listingTitle: z.string().describe("The title/name of the listing for display purposes"),
    }),
  },
];
