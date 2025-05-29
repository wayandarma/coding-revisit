import TodoList from "../../components/TodoList";

export default function TodosPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Daftar Tugas</h1>
        <TodoList />
      </div>
    </div>
  );
}
