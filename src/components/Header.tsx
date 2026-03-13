import { Bell } from 'lucide-react';

export default function Header() {
    return (
        <header className="flex h-16 shrink-0 items-center justify-end border-b border-slate-200 bg-white px-6">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
                <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 transition-colors">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                </button>
            </div>
        </header>
    );
}
