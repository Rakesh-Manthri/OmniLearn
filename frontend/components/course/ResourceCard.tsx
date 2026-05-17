'use client';

import React from 'react';
import { Play, FileText, Code, ExternalLink } from 'lucide-react';
import type { ResourceItem } from '@/services/api';

interface ResourceCardProps {
  resource: ResourceItem;
}

const SOURCE_CONFIG = {
  video: {
    icon: Play,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Video',
  },
  article: {
    icon: FileText,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'Article',
  },
  documentation: {
    icon: Code,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Docs',
  },
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const config = SOURCE_CONFIG[resource.source_type] || SOURCE_CONFIG.article;
  const Icon = config.icon;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 transition-all hover:border-primary/30 hover:bg-muted/60"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
        <Icon size={16} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-foreground truncate">{resource.title}</p>
          <ExternalLink size={12} className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {resource.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>
        )}
        <span className={`inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
          {config.label}
        </span>
      </div>
    </a>
  );
}
