import React from 'react';
import { Tag } from 'antd';

import type { RecordStatus, SystemTreeNode } from '../../api';

type TreeOption = {
  label: string;
  value: string;
};

type TreeSelectNode = {
  children?: TreeSelectNode[];
  title: string;
  value: string;
};

export const extractErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error && error.message ? error.message : fallback;
};

// 树形数据同时服务下拉选择和普通 Select，统一在这里拍平避免每个页面各写一份。
const flattenTreeNodeBranch = (
  nodes: SystemTreeNode[],
  parentLabels: string[] = [],
): TreeOption[] => {
  return nodes.flatMap((node) => {
    const currentLabels = [...parentLabels, node.title];
    const currentOption = {
      label: currentLabels.join(' / '),
      value: node.key,
    };

    return [currentOption, ...flattenTreeNodeBranch(node.children ?? [], currentLabels)];
  });
};

export const buildTreeOptions = (nodes: SystemTreeNode[], rootOption?: TreeOption) => {
  return rootOption ? [rootOption, ...flattenTreeNodeBranch(nodes)] : flattenTreeNodeBranch(nodes);
};

export const buildTreeSelectData = (nodes: SystemTreeNode[]): TreeSelectNode[] => {
  return nodes.map((node) => ({
    title: node.title,
    value: node.key,
    children: node.children ? buildTreeSelectData(node.children) : undefined,
  }));
};

export const normalizeCheckedKeys = (
  value:
    | React.Key[]
    | {
        checked: React.Key[];
        halfChecked?: React.Key[];
      },
) => {
  // ProTree 在 checkable 模式下可能返回数组，也可能返回携带 halfChecked 的对象。
  const checkedKeys = Array.isArray(value) ? value : value.checked;
  return checkedKeys.map((item) => String(item));
};

export const RecordStatusTag: React.FC<{
  activeText: string;
  disabledText: string;
  status?: RecordStatus | string;
}> = ({ activeText, disabledText, status }) => {
  const isActive = status === 'active';

  return <Tag color={isActive ? 'success' : 'default'}>{isActive ? activeText : disabledText}</Tag>;
};
