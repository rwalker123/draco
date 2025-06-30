"use client";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { dracoTheme } from "../theme";
import Layout from "./Layout";
import React from "react";

export default function ThemeClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={dracoTheme}>
      <CssBaseline />
      <Layout>{children}</Layout>
    </ThemeProvider>
  );
} 