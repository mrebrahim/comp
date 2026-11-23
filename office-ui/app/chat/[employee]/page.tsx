import { notFound } from "next/navigation";
import { employeeBySlug } from "@/lib/employees";
import ChatPanel from "./chat-panel";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ employee: string }>;
}) {
  const { employee } = await params;
  const person = employeeBySlug(employee);
  if (!person) notFound();

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-lg font-semibold">
          {person.name}{" "}
          <span className="text-sm font-normal text-slate-400">
            · {person.role}
          </span>
        </h1>
        {!person.hired && (
          <p className="mt-1 text-sm text-amber-400">
            الموظف ده مش متعيّن بعد. الرسايل بتتسجل، بس محدش هيردّ عليها لحد ما
            تعيّنه.
          </p>
        )}
      </header>
      <ChatPanel slug={person.slug} name={person.name} />
    </div>
  );
}
