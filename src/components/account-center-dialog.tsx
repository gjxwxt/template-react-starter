import React from 'react';
import { Alert, Input, Tabs, message } from 'antd';

import { ProDialog, ProForm, type ProFormField, type ProFormRef } from '@gjxwxt/react-components';
import { updateCurrentPassword, updateCurrentProfile } from '../api';
import { useAppContext } from '../app/providers';
import type { AppSession } from '../app/session';

type AccountTabKey = 'profile' | 'password';

const PasswordInput = Input.Password as unknown as React.ComponentType<Record<string, unknown>>;

interface AccountCenterDialogProps {
  open: boolean;
  onClose: () => void;
  session: AppSession;
}

interface ProfileFormValues {
  department?: string;
  displayName: string;
  email?: string;
  loginName: string;
  phone?: string;
  role: string;
}

interface PasswordFormValues {
  confirmPassword: string;
  currentPassword: string;
  nextPassword: string;
}

const ROLE_OPTIONS = ['admin', 'operator', 'viewer'] as const;

export const AccountCenterDialog: React.FC<AccountCenterDialogProps> = ({
  open,
  onClose,
  session,
}) => {
  const { t, updateSession } = useAppContext();
  const profileFormRef = React.useRef<ProFormRef>(null);
  const passwordFormRef = React.useRef<ProFormRef>(null);
  const [activeTab, setActiveTab] = React.useState<AccountTabKey>('profile');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    profileFormRef.current?.setValues({
      department: session.department,
      displayName: session.displayName,
      email: session.email,
      loginName: session.loginName,
      phone: session.phone,
      role: session.role,
    });
    passwordFormRef.current?.resetFields();
  }, [
    open,
    session.department,
    session.displayName,
    session.email,
    session.loginName,
    session.phone,
    session.role,
  ]);

  const handleClose = React.useCallback(() => {
    setActiveTab('profile');
    onClose();
  }, [onClose]);

  const profileFields = React.useMemo<ProFormField[]>(() => {
    return [
      {
        key: 'loginName',
        label: t.account.loginName,
        readonly: true,
        type: 'input',
      },
      {
        key: 'role',
        label: t.account.role,
        options: ROLE_OPTIONS.map((role) => ({
          label: t.roleLabels[role],
          value: role,
        })),
        readonly: true,
        type: 'select',
      },
      {
        key: 'displayName',
        label: t.account.displayName,
        placeholder: t.account.displayNamePlaceholder,
        type: 'input',
        formItemProps: {
          rules: [{ required: true, message: t.account.displayNamePlaceholder }],
        },
      },
      {
        key: 'department',
        label: t.account.department,
        placeholder: t.account.departmentPlaceholder,
        type: 'input',
      },
      {
        key: 'email',
        label: t.account.email,
        placeholder: t.account.emailPlaceholder,
        type: 'input',
        formItemProps: {
          rules: [{ type: 'email', message: t.account.emailInvalid }],
        },
      },
      {
        key: 'phone',
        label: t.account.phone,
        placeholder: t.account.phonePlaceholder,
        type: 'input',
      },
    ];
  }, [
    t.account.department,
    t.account.departmentPlaceholder,
    t.account.displayName,
    t.account.displayNamePlaceholder,
    t.account.email,
    t.account.emailInvalid,
    t.account.emailPlaceholder,
    t.account.loginName,
    t.account.phone,
    t.account.phonePlaceholder,
    t.account.role,
    t.roleLabels,
  ]);

  const passwordFields = React.useMemo<ProFormField[]>(() => {
    return [
      {
        key: 'currentPassword',
        label: t.account.currentPassword,
        placeholder: t.account.currentPasswordPlaceholder,
        type: 'input',
        component: PasswordInput,
        formItemProps: {
          rules: [{ required: true, message: t.account.currentPasswordPlaceholder }],
        },
      },
      {
        key: 'nextPassword',
        label: t.account.nextPassword,
        placeholder: t.account.nextPasswordPlaceholder,
        type: 'input',
        component: PasswordInput,
        formItemProps: {
          rules: [{ required: true, message: t.account.nextPasswordPlaceholder }],
        },
      },
      {
        key: 'confirmPassword',
        label: t.account.confirmPassword,
        placeholder: t.account.confirmPasswordPlaceholder,
        type: 'input',
        component: PasswordInput,
        formItemProps: {
          dependencies: ['nextPassword'],
          rules: [
            { required: true, message: t.account.confirmPasswordPlaceholder },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || value === getFieldValue('nextPassword')) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error(t.account.confirmPasswordMismatch));
              },
            }),
          ],
        },
      },
    ];
  }, [
    t.account.confirmPassword,
    t.account.confirmPasswordMismatch,
    t.account.confirmPasswordPlaceholder,
    t.account.currentPassword,
    t.account.currentPasswordPlaceholder,
    t.account.nextPassword,
    t.account.nextPasswordPlaceholder,
  ]);

  const handleSubmit = React.useCallback(async () => {
    setSubmitting(true);

    try {
      if (activeTab === 'profile') {
        const values = (await profileFormRef.current?.validate()) as ProfileFormValues | undefined;

        if (!values) {
          return;
        }

        const nextProfile = await updateCurrentProfile({
          department: values.department,
          displayName: values.displayName,
          email: values.email,
          phone: values.phone,
        });

        updateSession({
          department: nextProfile.department,
          displayName: nextProfile.displayName,
          email: nextProfile.email,
          phone: nextProfile.phone,
        });
        message.success(t.account.profileSuccess);
        handleClose();
        return;
      }

      const values = (await passwordFormRef.current?.validate()) as PasswordFormValues | undefined;

      if (!values) {
        return;
      }

      await updateCurrentPassword(values);
      message.success(t.account.passwordSuccess);
      handleClose();
    } catch (error) {
      if (error instanceof Error && error.message) {
        message.error(error.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeTab, handleClose, t.account.passwordSuccess, t.account.profileSuccess, updateSession]);

  return (
    <ProDialog
      open={open}
      title={t.account.dialogTitle}
      width={720}
      maxHeight={560}
      confirmLoading={submitting}
      onClose={handleClose}
      onCancel={handleClose}
      onSubmit={handleSubmit}
    >
      <div className="template-account-dialog">
        <Alert
          className="template-account-dialog__hint"
          type="info"
          showIcon
          message={activeTab === 'profile' ? t.account.profileHint : t.account.passwordHint}
        />

        <Tabs
          activeKey={activeTab}
          className="template-account-dialog__tabs"
          onChange={(key) => setActiveTab(key as AccountTabKey)}
          items={[
            {
              key: 'profile',
              label: t.account.profileTab,
              children: (
                <ProForm
                  ref={profileFormRef}
                  layout="horizontal"
                  labelWidth={104}
                  labelAlign="right"
                  showFootButton={false}
                  fields={profileFields}
                />
              ),
            },
            {
              key: 'password',
              label: t.account.passwordTab,
              children: (
                <ProForm
                  ref={passwordFormRef}
                  layout="horizontal"
                  labelWidth={104}
                  labelAlign="right"
                  showFootButton={false}
                  fields={passwordFields}
                />
              ),
            },
          ]}
        />
      </div>
    </ProDialog>
  );
};
