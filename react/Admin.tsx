/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FC } from 'react'
import React, { useState, useEffect } from 'react'
import { useIntl } from 'react-intl'
import { isEmpty } from 'ramda'
import { useQuery, useMutation } from 'react-apollo'
import {
  Layout,
  PageHeader,
  PageBlock,
  InputPassword,
  Input,
  Button,
  Toggle,
  ToastProvider,
  ToastConsumer,
  Alert,
} from 'vtex.styleguide'
import { useRuntime } from 'vtex.render-runtime'

import AppSettings from './graphql/appSettings.graphql'
import SaveAppSettings from './graphql/saveAppSettings.graphql'
import OrderFormConfiguration from './graphql/orderFormConfiguration.graphql'
import UpdateOrderFormConfiguration from './graphql/updateOrderFormConfiguration.graphql'

const Admin: FC = () => {
  const { formatMessage } = useIntl()
  const { account } = useRuntime()

  const [settingsState, setSettingsState] = useState({
    digitalRiverPublicKey: '',
    digitalRiverToken: '',
    vtexAppKey: '',
    vtexAppToken: '',
    isLive: false,
    isValid: true,
    isAutomaticSync: false,
    isTaxInclusive: false,
  })

  const [settingsLoading, setSettingsLoading] = useState(false)
  // const [taxStatus, setTaxStatus] = useState('')

  const { data } = useQuery(AppSettings, {
    variables: {
      version: process.env.VTEX_APP_VERSION,
    },
    ssr: false,
  })

  const { data: orderFormData, refetch } = useQuery(OrderFormConfiguration, {
    ssr: false,
  })

  const { appId } =
    orderFormData?.orderFormConfiguration?.taxConfiguration ?? {}

  const hasTaxConfiguration = !isEmpty(
    orderFormData?.orderFormConfiguration?.taxConfiguration ?? {}
  )

  const [saveSettings] = useMutation(SaveAppSettings)
  const [updateOrderFormConfiguration] = useMutation(
    UpdateOrderFormConfiguration
  )

  useEffect(() => {
    if (!data?.appSettings?.message) return

    const parsedSettings = JSON.parse(data.appSettings.message)

    setSettingsState((prevState) => {
      return { ...prevState, ...parsedSettings }
    })
  }, [data, account, formatMessage])

  const handleSaveSettings = async (showToast: any) => {
    setSettingsLoading(true)

    let updateOrderForm = false

    if (orderFormData?.orderFormConfiguration) {
      // set up custom orderForm fields
      if (
        !orderFormData.orderFormConfiguration.apps ||
        !orderFormData.orderFormConfiguration.apps.length
      ) {
        orderFormData.orderFormConfiguration.apps = [
          {
            id: 'digital-river',
            major: 0,
            fields: ['checkoutId', 'paymentSessionId'],
          },
        ]
        updateOrderForm = true
      } else if (
        !orderFormData.orderFormConfiguration.apps.find(
          (x: any) => x.id === 'digital-river'
        )
      ) {
        orderFormData.orderFormConfiguration.apps.push({
          id: 'digital-river',
          major: 0,
          fields: ['checkoutId', 'paymentSessionId'],
        })
        updateOrderForm = true
      }

      if (appId === 'vtexus.connector-digital-river' || !hasTaxConfiguration) {
        orderFormData.orderFormConfiguration.taxConfiguration = {
          url: `http://master--${account}.myvtex.com/_v/api/digital-river/checkout/order-tax`,
          authorizationHeader: settingsState.digitalRiverToken,
          allowExecutionAfterErrors: false,
          integratedAuthentication: false,
          appId: 'vtexus.connector-digital-river',
        }
        updateOrderForm = true
      }

      if (updateOrderForm) {
        await updateOrderFormConfiguration({
          variables: {
            configuration: orderFormData.orderFormConfiguration,
          },
        }).catch((err) => {
          console.error(err)
        })
      }
    }

    await fetch(`/_v/api/digital-river/setup`, {
      method: 'POST',
      cache: 'no-cache',
    })
    await saveSettings({
      variables: {
        version: process.env.VTEX_APP_VERSION,
        settings: JSON.stringify(settingsState),
      },
    })
      .catch((err) => {
        console.error(err)
        showToast({
          message: formatMessage({
            id: 'admin/digital-river.saveSettings.failure',
          }),
          duration: 5000,
        })
        setSettingsLoading(false)
      })
      .then(() => {
        showToast({
          message: formatMessage({
            id: 'admin/digital-river.saveSettings.success',
          }),
          duration: 5000,
        })
        refetch()
        setSettingsLoading(false)
      })
  }

  return (
    <ToastProvider positioning="window">
      <ToastConsumer>
        {({ showToast }: { showToast: any }) => (
          <Layout
            pageHeader={
              <PageHeader
                title={formatMessage({
                  id: 'admin/digital-river.configuration-label',
                })}
              />
            }
          >
            <PageBlock>
              {appId !== 'vtexus.connector-digital-river' &&
                hasTaxConfiguration && (
                  <section className="pb4">
                    <Alert type="error">
                      {formatMessage({
                        id: 'admin/digital-river.settings.alert.errorText',
                      })}
                    </Alert>
                  </section>
                )}

              <section className="pb4">
                <InputPassword
                  label={formatMessage({
                    id:
                      'admin/digital-river.settings.digitalRiverPublicKey.label',
                  })}
                  value={settingsState.digitalRiverPublicKey}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      digitalRiverPublicKey: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id:
                      'admin/digital-river.settings.digitalRiverPublicKey.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <InputPassword
                  label={formatMessage({
                    id: 'admin/digital-river.settings.digitalRiverToken.label',
                  })}
                  value={settingsState.digitalRiverToken}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      digitalRiverToken: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id:
                      'admin/digital-river.settings.digitalRiverToken.helpText',
                  })}
                  token
                />
              </section>
              <section className="pb4">
                <Input
                  label={formatMessage({
                    id: 'admin/digital-river.settings.vtexAppKey.label',
                  })}
                  value={settingsState.vtexAppKey}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      vtexAppKey: e.currentTarget.value,
                    })
                  }
                  token
                />
              </section>
              <section className="pb4">
                <InputPassword
                  label={formatMessage({
                    id: 'admin/digital-river.settings.vtexAppToken.label',
                  })}
                  value={settingsState.vtexAppToken}
                  onChange={(e: React.FormEvent<HTMLInputElement>) =>
                    setSettingsState({
                      ...settingsState,
                      vtexAppToken: e.currentTarget.value,
                    })
                  }
                  helpText={formatMessage({
                    id: 'admin/digital-river.settings.vtexAppToken.helpText',
                  })}
                  token
                />
              </section>
              <section className="pv4">
                <Toggle
                  semantic
                  label={formatMessage({
                    id: 'admin/digital-river.settings.isLive.label',
                  })}
                  size="large"
                  checked={settingsState.isLive}
                  onChange={() => {
                    setSettingsState({
                      ...settingsState,
                      isLive: !settingsState.isLive,
                    })
                  }}
                  helpText={formatMessage({
                    id: 'admin/digital-river.settings.isLive.helpText',
                  })}
                />
              </section>
              <section className="pv4">
                <Toggle
                  semantic
                  label={formatMessage({
                    id: 'admin/digital-river.settings.isAutomaticSync.label',
                  })}
                  size="large"
                  checked={settingsState.isAutomaticSync}
                  onChange={() => {
                    setSettingsState({
                      ...settingsState,
                      isAutomaticSync: !settingsState.isAutomaticSync,
                    })
                  }}
                  helpText={formatMessage({
                    id: 'admin/digital-river.settings.isAutomaticSync.helpText',
                  })}
                />
              </section>
              <section className="pv4">
                <Toggle
                  semantic
                  label={formatMessage({
                    id: 'admin/digital-river.settings.enableTaxInclusive.label',
                  })}
                  size="large"
                  checked={settingsState.isTaxInclusive}
                  onChange={() => {
                    setSettingsState({
                      ...settingsState,
                      isTaxInclusive: !settingsState.isTaxInclusive,
                    })
                  }}
                  helpText={formatMessage({
                    id:
                      'admin/digital-river.settings.enableTaxInclusive.helpText',
                  })}
                />
              </section>
              <section className="pt4">
                <Button
                  variation="primary"
                  onClick={() => handleSaveSettings(showToast)}
                  isLoading={settingsLoading}
                  disabled={
                    (appId !== 'vtexus.connector-digital-river' &&
                      hasTaxConfiguration) ||
                    !settingsState.digitalRiverPublicKey ||
                    !settingsState.digitalRiverToken ||
                    !settingsState.vtexAppKey ||
                    !settingsState.vtexAppToken
                  }
                >
                  {formatMessage({
                    id: 'admin/digital-river.saveSettings.buttonText',
                  })}
                </Button>
              </section>
            </PageBlock>
          </Layout>
        )}
      </ToastConsumer>
    </ToastProvider>
  )
}

export default Admin
