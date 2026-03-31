/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin, Typography } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export default function SettingsRetrySwitch(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    RetryStatusCodes: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function normalizeStatusCodes(raw) {
    const uniq = new Set();
    const parts = String(raw || '').split(',');
    for (const part of parts) {
      const code = parseInt(part.trim(), 10);
      if (!Number.isNaN(code) && code > 0) {
        uniq.add(code);
      }
    }
    return Array.from(uniq).sort((a, b) => a - b).join(',');
  }

  function onSubmit() {
    const normalized = normalizeStatusCodes(inputs.RetryStatusCodes);
    const mergedInputs = {
      ...inputs,
      RetryStatusCodes: normalized,
    };

    const updateArray = compareObjects(mergedInputs, inputsRow);
    if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));

    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof mergedInputs[item.key] === 'boolean') {
        value = String(mergedInputs[item.key]);
      } else {
        value = mergedInputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });

    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t('部分保存失败，请重试'));
        }
        showSuccess(t('保存成功'));
        props.refresh();
      })
      .catch(() => {
        showError(t('保存失败，请重试'));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('按状态码自动切换渠道重试')}>
            <Row gutter={16}>
              <Col xs={24} sm={24} md={18} lg={16} xl={14}>
                <Form.Input
                  field={'RetryStatusCodes'}
                  label={t('触发重试的状态码')}
                  placeholder={t('例如 400,401,403,429,500,502,503')}
                  extraText={t('使用英文逗号分隔。命中这些状态码时会自动切换新渠道重试。')}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      RetryStatusCodes: value,
                    })
                  }
                  showClear
                />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Text type='tertiary'>
                  {t('说明：该配置是全局规则；当指定了固定渠道或重试次数为 0 时不会触发重试。')}
                </Text>
              </Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Button size='default' onClick={onSubmit}>
                {t('保存重试设置')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}
