import React from "react";

export default function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 ${light ? "border-white border-t-gray-400" : "border-violet-500 border-t-transparent"} rounded-full animate-spin`}
      aria-label="Loading..."
    />
  );
}
