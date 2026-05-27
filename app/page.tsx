"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [lxcs, setLxcs] = useState<any[]>([]);
  const [registry, setRegistry] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/lxc");
      if (!res.ok) {
        setLxcs([]);
        return;
      }
      const data = await res.json();
      setLxcs(Array.isArray(data) ? data : []);
    }

    load();
  }, []);

   useEffect(() => {
    async function load() {
      const res = await fetch("/api/registry");
      if (!res.ok) {
        setRegistry([]);
        return;
      }
      const data = await res.json();
      setRegistry(Array.isArray(data) ? data : []);
    }

    load();
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-6">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Welcome to FortmontAPI
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
        Your API for managing LXC containers with ease.
      </p>
      <p className="text-md text-gray-500 dark:text-gray-500 mb-12">
        Registry info follows below
      </p>
     {registry.length === 0 ? (
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Registry Servers
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            No registry entries found.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Registry Server Information
          </h2>
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">ID</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Name</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Version</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Hosted on</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Server URL</th>
              </tr>
            </thead>
            <tbody>
              {registry.map((entry: any) => (
                <tr key={entry.id} className="border-b border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-2">{entry.id}</td>
                  <td className="px-4 py-2">{entry.name ?? "-"}</td>
                  <td className="px-4 py-2">{entry.version ?? "-"}</td>
                  <td className="px-4 py-2">{entry.hosted_on ?? "-"}</td>
                  <td className="px-4 py-2">{entry.server_url ?? "-"}</td>
                    
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-auto">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Results from the remote database:
        </h2>

        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">IP</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Status</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Role</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Compose Status</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Created At</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Unique ID</th>
            </tr>
          </thead>

          <tbody>
            {lxcs.length === 0 ? (
              <tr>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400" colSpan={6}>
                  No records found.
                </td>
              </tr>
            ) : (
              lxcs.map((lxc: any) => (
                <tr key={lxc.lxc_unique_id} className="border-b border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-2">{lxc.lxc_ip ?? "-"}</td>
                  <td className="px-4 py-2">{lxc.lxc_status ?? "-"}</td>
                  <td className="px-4 py-2">{lxc.lxc_role ?? "-"}</td>
                  <td className="px-4 py-2">{lxc.lxc_compose_status ?? "-"}</td>
                  <td className="px-4 py-2">{lxc.created_at ? new Date(lxc.created_at).toLocaleString() : "-"}</td>
                  <td className="px-4 py-2">{lxc.lxc_unique_id ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}