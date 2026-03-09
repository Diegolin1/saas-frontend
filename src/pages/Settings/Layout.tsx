import { useState } from 'react';
import { BuildingOffice2Icon, UsersIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import UserManagement from './UserManagement';
import CompanySettings from './CompanySettings';
import SecuritySettings from './SecuritySettings';

const SettingsLayout = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { name: 'Empresa', id: 'general', icon: BuildingOffice2Icon },
        { name: 'Usuarios', id: 'users', icon: UsersIcon },
        { name: 'Seguridad', id: 'security', icon: LockClosedIcon },
    ];

    return (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0 bg-white rounded-xl shadow-sm border border-slate-200 h-fit">
                <nav className="space-y-1 p-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg w-full transition-colors
                                ${activeTab === tab.id
                                    ? 'bg-stone-900 text-white'
                                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}
                            `}
                        >
                            <tab.icon
                                className={`
                                    flex-shrink-0 -ml-1 mr-3 h-5 w-5
                                    ${activeTab === tab.id ? 'text-stone-300' : 'text-stone-400 group-hover:text-stone-500'}
                                `}
                                aria-hidden="true"
                            />
                            <span className="truncate">{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">
                {activeTab === 'general' && <CompanySettings />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'security' && <SecuritySettings />}
            </div>
        </div>
    );
};

export default SettingsLayout;
