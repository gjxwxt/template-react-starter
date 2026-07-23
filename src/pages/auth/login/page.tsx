import React from 'react';
import { Checkbox, Form, Input, Tooltip, message } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';

import { ProButton } from '@gjxwxt/react-components';
import { loginByPassword } from '../../../api';
import { useAppContext } from '../../../app/providers';
import { resolveTemplateAssetPath, templateAppConfig } from '../../../app/config';

type LoginFormValues = {
  captcha: string;
  loginName: string;
  password: string;
};

const CAPTCHA_WIDTH = 125;
const CAPTCHA_HEIGHT = 40;

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';

  for (let index = 0; index < 4; index += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
};

const LoginPage: React.FC = () => {
  const { login, t } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [form] = Form.useForm<LoginFormValues>();
  const [rememberPassword, setRememberPassword] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const captchaCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const captchaCodeRef = React.useRef('');

  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : templateAppConfig.auth.homePath;
  const loginPageStyle = React.useMemo(
    () => ({
      backgroundImage: `url(${resolveTemplateAssetPath('png/loginbkg.png')})`,
    }),
    [],
  );

  const drawCaptcha = React.useCallback(() => {
    const canvas = captchaCanvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const nextCode = generateCaptcha();
    captchaCodeRef.current = nextCode;

    context.clearRect(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, CAPTCHA_WIDTH, CAPTCHA_HEIGHT);
    context.font = '500 16px "PingFang SC", sans-serif';
    context.fillStyle = '#303A5D';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    nextCode.split('').forEach((char, index) => {
      context.save();
      const x = 22 + index * 25;
      const y = 20 + (Math.random() - 0.5) * 6;
      const angle = (Math.random() - 0.5) * 0.3;
      context.translate(x, y);
      context.rotate(angle);
      context.fillText(char, 0, 0);
      context.restore();
    });

    for (let index = 0; index < 3; index += 1) {
      context.beginPath();
      context.strokeStyle = `rgba(${Math.random() * 200}, ${Math.random() * 200}, ${
        Math.random() * 200
      }, 0.3)`;
      context.lineWidth = 1;
      context.moveTo(Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT);
      context.lineTo(Math.random() * CAPTCHA_WIDTH, Math.random() * CAPTCHA_HEIGHT);
      context.stroke();
    }
  }, []);

  React.useEffect(() => {
    drawCaptcha();
  }, [drawCaptcha]);

  const handleSubmit = React.useCallback(
    async (values: LoginFormValues) => {
      const isDev = import.meta.env.DEV;
      const isCaptchaValid =
        values.captcha.trim().toLowerCase() === captchaCodeRef.current.toLowerCase();
      const isBypass = isDev && values.captcha.trim() === '0000';

      if (!isCaptchaValid && !isBypass) {
        message.error(t.login.captchaError);
        form.setFieldValue('captcha', '');
        drawCaptcha();
        return;
      }

      setSubmitting(true);

      try {
        const session = await loginByPassword({
          loginName: values.loginName,
          password: values.password,
        });

        login(session);
        message.success(t.login.success);
        navigate(redirectPath, { replace: true });
      } catch (error) {
        message.error(error instanceof Error ? error.message : 'Login failed.');
        drawCaptcha();
      } finally {
        setSubmitting(false);
      }
    },
    [drawCaptcha, form, login, navigate, redirectPath, t.login.captchaError, t.login.success],
  );

  return (
    <div className="login-page" style={loginPageStyle}>
      <div className="login-page__content">
        <div className="login-page__card">
          <div className="login-page__card-inner">
            <div className="login-page__header">
              <div className="login-page__logo-box">
                <img
                  className="login-page__logo-image"
                  src={templateAppConfig.branding.logoSrc}
                  alt={templateAppConfig.branding.logoAlt}
                />
              </div>
              <div className="login-page__platform-title">{t.login.platformTitle}</div>
            </div>

            <div className="login-page__welcome">{t.login.welcomeText}</div>

            <Form<LoginFormValues>
              className="login-page__form"
              form={form}
              layout="vertical"
              initialValues={{
                loginName: '',
                password: '',
                captcha: '',
              }}
              onFinish={handleSubmit}
            >
              <Form.Item
                name="loginName"
                rules={[{ required: true, message: t.login.loginNamePlaceholder }]}
              >
                <Input
                  size="large"
                  placeholder={t.login.loginNamePlaceholder}
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: t.login.passwordPlaceholder }]}
              >
                <Input.Password
                  size="large"
                  placeholder={t.login.passwordPlaceholder}
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item
                name="captcha"
                rules={[{ required: true, message: t.login.captchaPlaceholder }]}
              >
                <div className="login-page__captcha-row">
                  <Input
                    size="large"
                    className="login-page__captcha-input"
                    placeholder={t.login.captchaPlaceholder}
                  />
                  <button
                    type="button"
                    className="login-page__captcha-display"
                    onClick={drawCaptcha}
                    aria-label={t.login.captcha}
                  >
                    <canvas ref={captchaCanvasRef} width={CAPTCHA_WIDTH} height={CAPTCHA_HEIGHT} />
                  </button>
                </div>
              </Form.Item>

              <div className="login-page__action-row">
                <Checkbox
                  checked={rememberPassword}
                  onChange={(event) => setRememberPassword(event.target.checked)}
                >
                  {t.login.rememberPassword}
                </Checkbox>

                <Tooltip title={t.login.forgotPasswordTooltip} placement="bottomRight">
                  <span className="login-page__forget-link">{t.login.forgotPassword}</span>
                </Tooltip>
              </div>

              <div className="login-page__submit">
                <ProButton type="primary" htmlType="submit" loading={submitting}>
                  {t.login.submit}
                </ProButton>
              </div>
            </Form>
          </div>
        </div>
      </div>

      <div className="login-page__footer">{t.shell.footer}</div>
    </div>
  );
};

export default LoginPage;
