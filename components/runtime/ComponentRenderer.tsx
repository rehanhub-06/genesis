"use client";

import React from "react";
import type { UIComponent } from "@/types/schema";
import TableComponent from "@/components/runtime/components/TableComponent";
import FormComponent from "@/components/runtime/components/FormComponent";
import StatsComponent from "@/components/runtime/components/StatsComponent";
import ButtonComponent from "@/components/runtime/components/ButtonComponent";
import CardComponent from "@/components/runtime/components/CardComponent";
import NavbarComponent from "@/components/runtime/components/NavbarComponent";
import UnknownComponent from "@/components/runtime/components/UnknownComponent";

interface ComponentRendererProps {
  component: UIComponent;
  data: Record<string, unknown>[];
  onFormSubmit?: (formData: Record<string, unknown>) => void;
}

const COMPONENT_MAP: Record<
  string,
  React.ComponentType<{
    component: UIComponent;
    data: Record<string, unknown>[];
    onSubmit?: (formData: Record<string, unknown>) => void;
  }>
> = {
  table: TableComponent,
  form: FormComponent,
  stats: StatsComponent,
  button: ButtonComponent,
  card: CardComponent,
  navbar: NavbarComponent,
};

export default function ComponentRenderer({
  component,
  data,
  onFormSubmit,
}: ComponentRendererProps) {
  const Component = COMPONENT_MAP[component.type];

  if (!Component) {
    return <UnknownComponent component={component} data={data} />;
  }

  return (
    <Component
      component={component}
      data={data}
      onSubmit={component.type === "form" ? onFormSubmit : undefined}
    />
  );
}
