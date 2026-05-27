"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"


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
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <header className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 fixed top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-xl font-bold text-gray-800 dark:text-gray-100">FortmontAPI</div>
            <nav className="hidden md:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <a href="#" className="hover:underline">Home</a>
              <a href="#registry" className="hover:underline">Registry</a>
              <a href="#lxc" className="hover:underline">LXC</a>
            </nav>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/admin"}>
              Admin Console
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 items-center justify-start p-6 pt-20">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">
        Welcome to FortmontAPI
      </h1>
      <p className="text-md text-gray-800 dark:text-gray-100 mb-12">
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
        <div className="w-full max-w-4xl bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Registry Server Information
          </h2>
          <table className="min-w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">ID</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Name</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Version</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Hosted on</th>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Server URL</th>
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
      <p className=" font-semibold text-gray-800 dark:text-gray-200 mb-4">
            lxc info follows below
          </p>
      <div className="w-full max-w-4xl bg-white dark:bg-black border border-gray-300 dark:border-gray-600 rounded-lg shadow-md p-6 overflow-auto">
        

        <table className="min-w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">IP</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Status</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Role</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Compose Status</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Created At</th>
              <th className="px-4 py-2 text-left text-gray-600 dark:text-green-600">Unique ID</th>
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
      </main>
    </div>
  );
}