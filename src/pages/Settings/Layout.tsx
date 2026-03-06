import { useState } from 'react';
import { BuildingOffice2Icon, UsersIcon } from '@heroicons/react/24/outline';
import UserManagement from './UserManagement';
import CompanySettings from './CompanySettings';

const SettingsLayout = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { name: 'Empresa', id: 'general', icon: BuildingOffice2Icon },
        { name: 'Usuarios', id: 'users', icon: UsersIcon },
    ];

    return (
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0 bg-white rounded-lg shadow h-fit">
                <nav className="space-y-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full
                                ${activeTab === tab.id
                                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700'
                                    : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                        >
                            <tab.icon
                                className={`
                                    flex-shrink-0 -ml-1 mr-3 h-6 w-6
                                    ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
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
            </div>
        </div>
    );
};

export default SettingsLayout;
