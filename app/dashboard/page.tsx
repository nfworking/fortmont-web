export default function DashboardPage() {
  const apps = [
    { name: "Fortmont Home", href: "https://home.fortmont.me", icon: "🏠" },
    { name: "Fortmont IAM", href: "https://iam.fortmont.me", icon: "🔑" },
    {
      name: "Fortmont Services",
      href: "https://services.fortmont.me",
      icon: "🛠️",
    },
    { name: "Fortmont Hub", href: "https://hub.fortmont.me", icon: "🏢" },
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to Fortmont
          </h1>
          <p className="text-xl text-slate-300">Internal API Platform</p>
        </div>

        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 mb-8 border border-slate-700">
          <p className="text-slate-200 text-center mb-2">
            Hey there! Looks like you found your way to our internal hub. 😊
          </p>
          <p className="text-slate-200 text-center mb-2">
            It is not intended for human access, please head over to our
            consumer applications listed below.
          </p>

          <p className="text-slate-400 text-center text-sm">
            Don't know which application to use? Head over to{" "}
            <a
              href="https://fortmont.me/platforms"
              className="text-blue-400 underline"
            >
              https://fortmont.me/platforms
            </a>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.href}
              className="group p-6 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all duration-300 transform hover:-translate-y-1 border border-slate-600 hover:border-slate-500 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{app.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {app.name}
                  </h3>
                  <p className="text-sm text-slate-400">Go to {app.name}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
