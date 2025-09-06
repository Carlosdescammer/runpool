// components/NotificationSwitch.tsx
'use client';

import { Switch } from '@/components/ui/switch';

interface NotificationSwitchProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function NotificationSwitch({ id, title, description, checked, onCheckedChange }: NotificationSwitchProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div className="flex flex-col">
        <label htmlFor={id} className="font-medium cursor-pointer">{title}</label>
        <p id={`${id}-description`} className="text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-labelledby={id}
        aria-describedby={`${id}-description`}
      />
    </div>
  );
}
