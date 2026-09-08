'use client';

import React, { useState } from 'react';
import { UserRole, ROLE_PERMISSIONS } from '@/types/auth';
import { Shield, ChevronDown, Check, UserCircle2 } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeRoleInfo = ROLE_PERMISSIONS[currentRole];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm transition-all ${activeRoleInfo.badgeColor} hover:opacity-90`}
        title={activeRoleInfo.description}
      >
        <Shield className="w-3.5 h-3.5 text-current" />
        <span>{activeRoleInfo.title}</span>
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100 py-1">
            <div className="px-3 py-2 bg-gray-50 text-[11px] font-medium text-gray-500 flex items-center gap-1">
              <UserCircle2 className="w-3.5 h-3.5" />
              <span>CHỌN VAI TRÒ KIỂM THỬ (RBAC)</span>
            </div>
            {Object.values(ROLE_PERMISSIONS).map((perm) => {
              const isSelected = perm.role === currentRole;
              return (
                <button
                  key={perm.role}
                  type="button"
                  onClick={() => {
                    onRoleChange(perm.role);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-start justify-between gap-2 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50/50 font-semibold text-blue-900' : 'text-gray-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${perm.role === 'bgh' ? 'bg-purple-500' : perm.role === 'ke_toan' ? 'bg-blue-500' : perm.role === 'bep_truong' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span>{perm.title}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight font-normal">
                      {perm.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
