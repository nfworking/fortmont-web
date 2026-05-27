export default function AdminConsole() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Welcome to the Admin Console
        </h1>
        <p className="text-md text-gray-800 dark:text-gray-100 mb-12">
            This is where you can manage your registry servers and LXC containers.  
            Use the navigation menu to access different sections of the console.
        </p>
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Registry Servers
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
                Here you can view, add, edit, and delete registry server entries.
            </p>
        </div>
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                LXC Containers
            </h2>   
            <p className="text-gray-600 dark:text-gray-400">
                Here you can view, add, edit, and delete LXC container entries.
            </p>
        </div>
    </div>
  );
}