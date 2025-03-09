// components/Sidebar.tsx
import { users } from "./users";

interface SidebarProps {
  currentUser: User | null;
  setSelectedUser: (user: User) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

interface User {
  id: number;
  username: string;
  password: string;
  avatar: string;
}

const Sidebar = ({
  currentUser,
  setSelectedUser,
  isSidebarOpen,
  toggleSidebar,
}: SidebarProps) => {
  return (
    <div
      className={`w-64 bg-white rounded-lg shadow-md p-4 fixed md:relative left-1 top-16 md:top-0 transform ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
    >
      <h2 className="text-xl font-bold mb-4">Users</h2>
      {users
        .filter((user) => user.id !== currentUser?.id)
        .map((user) => (
          <div
            key={user.id}
            className="flex items-center mb-4 cursor-pointer"
            onClick={() => {
              setSelectedUser(user);
              toggleSidebar();
            }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-500 text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span className="ml-2 text-black">{user.username}</span>
          </div>
        ))}
    </div>
  );
};
export default Sidebar;
