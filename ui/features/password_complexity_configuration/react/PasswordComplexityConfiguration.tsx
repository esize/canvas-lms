/*
 * Copyright (C) 2024 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {useCallback, useEffect, useState} from 'react'
import {useScope as useI18nScope} from '@canvas/i18n'
import {Heading} from '@instructure/ui-heading'
import {Text} from '@instructure/ui-text'
import {View} from '@instructure/ui-view'
import {Button, CloseButton, IconButton} from '@instructure/ui-buttons'
import {Tray} from '@instructure/ui-tray'
import {Alert} from '@instructure/ui-alerts'
import {List} from '@instructure/ui-list'
import {Checkbox} from '@instructure/ui-checkbox'
import NumberInputControlled from './NumberInputControlled'
import {IconTrashLine, IconUploadSolid} from '@instructure/ui-icons'
import {showFlashAlert} from '@canvas/alerts/react/FlashAlert'
import {executeApiRequest} from '@canvas/do-fetch-api-effect/apiRequest'
import ForbiddenWordsFileUpload from './ForbiddenWordsFileUpload'
import type {GlobalEnv} from '@canvas/global/env/GlobalEnv.d'
import {Flex} from '@instructure/ui-flex'
import doFetchApi from '@canvas/do-fetch-api-effect'
import {Link} from '@instructure/ui-link'

const I18n = useI18nScope('password_complexity_configuration')

declare const ENV: GlobalEnv

interface PasswordPolicy {
  require_number_characters: boolean
  require_symbol_characters: boolean
  allow_login_suspension: boolean
  maximum_login_attempts?: number
  minimum_character_length?: number
}

interface Settings {
  password_policy: PasswordPolicy
}

interface Account {
  settings: Settings
}

interface QueryParams {
  account: Account
}

interface ForbiddenWordsResponse {
  public_url: string
  filename: string
}

export const fetchLatestForbiddenWords = async (): Promise<ForbiddenWordsResponse | null> => {
  const {response, json} = await doFetchApi({
    path: `/api/v1/accounts/${ENV.ACCOUNT_ID}/password_complexity/latest_forbidden_words`,
    method: 'GET',
  })
  return response.ok ? (json as ForbiddenWordsResponse) ?? null : null
}

// TODO: FOO-4640
const deleteForbiddenWordsFile = async () => {
  try {
    // mocked response as placeholder
    const mockResponse = {
      response: {
        ok: true,
      },
      json: {
        workflow_state: 'deleted',
      },
    }

    // un-comment the real API call when ready to switch from mock to live
    // const response = await doFetchApi({
    //   path: `/api/v1/accounts/${ENV.ACCOUNT_ID}/password_complexity/delete_forbidden_words`,
    //   method: 'PUT',
    //   body: {
    //     workflow_state: 'deleted',
    //   },
    // })

    if (!mockResponse.response.ok) {
      throw new Error('Failed to delete forbidden words file.')
    }

    // return the mock response for now
    return mockResponse

    // un-comment the following line when using the real API call
    // return response
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error deleting forbidden words file:', error)
    throw error
  }
}

const PasswordComplexityConfiguration = () => {
  const [showTray, setShowTray] = useState(false)
  const [enableApplyButton, setEnableApplyButton] = useState(true)
  const [minimumCharacterLengthEnabled, setMinimumCharacterLengthEnabled] = useState(true)
  const [minimumCharacterLength, setMinimumCharacterLength] = useState(8)
  const [requireNumbersEnabled, setRequireNumbersEnabled] = useState(true)
  const [requireSymbolsEnabled, setRequireSymbolsEnabled] = useState(true)
  const [customForbiddenWordsEnabled, setCustomForbiddenWordsEnabled] = useState(false)
  const [customMaxLoginAttemptsEnabled, setCustomMaxLoginAttemptsEnabled] = useState(false)
  const [allowLoginSuspensionEnabled, setAllowLoginSuspensionEnabled] = useState(false)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(10)
  const [fileModalOpen, setFileModalOpen] = useState(false)
  const [forbiddenWordsUrl, setForbiddenWordsUrl] = useState<string | null>(null)
  const [forbiddenWordsFilename, setForbiddenWordsFilename] = useState<string | null>(null)

  const fetchAndSetForbiddenWords = useCallback(async () => {
    try {
      const data = await fetchLatestForbiddenWords()
      if (data) {
        setForbiddenWordsUrl(data.public_url)
        setForbiddenWordsFilename(data.filename)
      } else {
        setForbiddenWordsUrl(null)
        setForbiddenWordsFilename(null)
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setForbiddenWordsUrl(null)
        setForbiddenWordsFilename(null)
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch forbidden words:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (showTray) {
      fetchAndSetForbiddenWords()
    }
  }, [showTray, fetchAndSetForbiddenWords])

  const handleOpenTray = () => {
    setShowTray(true)
  }

  const handleCustomMaxLoginAttemptToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setCustomMaxLoginAttemptsEnabled(checked)
  }

  const handleAllowLoginSuspensionToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setAllowLoginSuspensionEnabled(checked)
  }

  const handleMinimumCharacterChange = (value: number) => {
    setMinimumCharacterLength(value)
  }

  const handleMaxLoginAttemptsChange = (value: number) => {
    setMaxLoginAttempts(value)
  }

  const saveChanges = async () => {
    setEnableApplyButton(false)

    const updateAccountUrl = `/api/v1/accounts/${ENV.DOMAIN_ROOT_ACCOUNT_ID}/`
    const passwordPolicy: PasswordPolicy = {
      require_number_characters: requireNumbersEnabled,
      require_symbol_characters: requireSymbolsEnabled,
      allow_login_suspension: allowLoginSuspensionEnabled,
    }

    if (customMaxLoginAttemptsEnabled) {
      passwordPolicy.maximum_login_attempts = maxLoginAttempts
    }

    if (minimumCharacterLengthEnabled) {
      passwordPolicy.minimum_character_length = minimumCharacterLength
    }

    const requestBody: QueryParams = {
      account: {
        settings: {
          password_policy: passwordPolicy,
        },
      },
    }

    try {
      const {status} = await executeApiRequest<QueryParams>({
        path: updateAccountUrl,
        body: requestBody,
        method: 'PUT',
      })
      if (status === 200) {
        showFlashAlert({
          message: I18n.t('Password settings saved successfully.'),
          type: 'success',
        })
        setShowTray(false)
      }
    } catch (err: any) {
      // err type has to be any because the error object is not defined
      showFlashAlert({
        message: I18n.t('An error occurred applying password policy settings.'),
        err,
        type: 'error',
      })
    } finally {
      setEnableApplyButton(true)
    }
  }

  const deleteForbiddenWords = useCallback(async () => {
    try {
      await deleteForbiddenWordsFile()

      setForbiddenWordsUrl(null)
      setForbiddenWordsFilename(null)

      showFlashAlert({
        message: I18n.t('Forbidden words list deleted successfully.'),
        type: 'success',
      })
    } catch (error) {
      showFlashAlert({
        message: I18n.t('Failed to delete forbidden words list.'),
        type: 'error',
      })
    }
  }, [])

  const handleCancelUploadModal = useCallback(() => {
    setFileModalOpen(false)
  }, [])

  return (
    <>
      <Heading margin="small auto xx-small auto" level="h4">
        {I18n.t('Password Options')}
      </Heading>
      <Button onClick={handleOpenTray} color="primary">
        {I18n.t('View Options')}
      </Button>
      <Tray
        label="Password Options Tray"
        open={showTray}
        onDismiss={() => setShowTray(false)}
        placement="end"
        size="medium"
      >
        <Flex as="div" direction="column" height="100vh">
          <Flex.Item shouldGrow={true} shouldShrink={true} padding="small" as="main">
            <Flex as="div" direction="row" justifyItems="space-between">
              <Flex.Item>
                <View as="div" margin="small 0 small medium">
                  <Heading level="h3">{I18n.t('Password Options')}</Heading>
                </View>
              </Flex.Item>
              <Flex.Item>
                <CloseButton
                  margin="xxx-small 0 0 0"
                  offset="small"
                  screenReaderLabel="Close"
                  onClick={() => setShowTray(false)}
                />
              </Flex.Item>
            </Flex>
            <View as="div" margin="0 0 0 medium">
              <View as="div" margin="xxx-small auto small auto">
                <Text size="small" lineHeight="fit">
                  {I18n.t(
                    'Some institutions have very strict policies regarding passwords. This feature enables customization of password requirements and options for this auth provider. Modifications to password options will customize the password configuration text as seen below. If a custom minimum character length or maximum login attempts is not set, their default values will be used.'
                  )}
                </Text>
              </View>
              <Heading level="h4">{I18n.t('Current Password Configuration')}</Heading>
            </View>
            <Alert variant="info" margin="small medium medium medium">
              {I18n.t('Your password must meet the following requirements')}
              <List margin="xxx-small">
                <List.Item>{I18n.t('Must be at least 8 Characters in length.')}</List.Item>
                <List.Item>
                  {I18n.t(
                    'Must not use words or sequences of characters common in passwords (ie: password, 12345, etc...)'
                  )}
                </List.Item>
              </List>
            </Alert>
            <View as="div" margin="medium medium small medium">
              <Checkbox
                label={I18n.t('Minimum character length (minimum: 8 | maximum: 255)')}
                checked={minimumCharacterLengthEnabled}
                onChange={() => setMinimumCharacterLengthEnabled(!minimumCharacterLengthEnabled)}
                defaultChecked={true}
                data-testid="minimumCharacterLengthCheckbox"
              />
            </View>
            <View as="div" maxWidth="9rem" margin="0 medium medium medium">
              <View as="div" margin="0 medium medium medium">
                <NumberInputControlled
                  minimum={8}
                  maximum={255}
                  currentValue={minimumCharacterLength}
                  updateCurrentValue={handleMinimumCharacterChange}
                  disabled={!minimumCharacterLengthEnabled}
                  data-testid="minimumCharacterLengthInput"
                />
              </View>
            </View>
            <View as="div" margin="medium">
              <Checkbox
                label={I18n.t('Require number characters (0...9)')}
                checked={requireNumbersEnabled}
                onChange={() => setRequireNumbersEnabled(!requireNumbersEnabled)}
                defaultChecked={true}
                data-testid="requireNumbersCheckbox"
              />
            </View>
            <View as="div" margin="medium">
              <Checkbox
                label={I18n.t('Require symbol characters (ie: ! @ # $ %)')}
                checked={requireSymbolsEnabled}
                onChange={() => setRequireSymbolsEnabled(!requireSymbolsEnabled)}
                defaultChecked={true}
                data-testid="requireSymbolsCheckbox"
              />
            </View>
            <View as="div" margin="medium">
              <Checkbox
                checked={customForbiddenWordsEnabled}
                onChange={() => {
                  setCustomForbiddenWordsEnabled(!customForbiddenWordsEnabled)
                }}
                label={I18n.t('Customize forbidden words/terms list (see default list here)')}
                data-testid="customForbiddenWordsCheckbox"
              />
              <View
                as="div"
                insetInlineStart="1.75em"
                position="relative"
                margin="xx-small small small 0"
              >
                <Text size="small">
                  {I18n.t(
                    'Upload a list of forbidden words/terms in addition to the default list. The file should be text file (.txt) with a single word or term per line.'
                  )}
                </Text>
                <View as="div" margin="small 0">
                  <Button
                    disabled={!customForbiddenWordsEnabled}
                    renderIcon={IconUploadSolid}
                    onClick={() => setFileModalOpen(true)}
                    data-testid="uploadButton"
                  >
                    {I18n.t('Upload')}
                  </Button>
                </View>
              </View>
              {forbiddenWordsUrl && forbiddenWordsFilename && (
                <View as="div" margin="0 medium medium medium">
                  <Heading level="h4">{I18n.t('Current Custom List')}</Heading>
                  <hr />
                  <Flex justifyItems="space-between">
                    <Flex.Item>
                      <Link href={forbiddenWordsUrl} target="_blank">
                        {forbiddenWordsFilename}
                      </Link>
                    </Flex.Item>
                    <Flex.Item>
                      <IconButton
                        withBackground={false}
                        withBorder={false}
                        screenReaderLabel="Delete list"
                        onClick={deleteForbiddenWords}
                      >
                        <IconTrashLine color="warning" />
                      </IconButton>
                    </Flex.Item>
                  </Flex>
                  <hr />
                </View>
              )}
            </View>
            <View as="div" margin="medium medium small medium">
              <Checkbox
                onChange={handleCustomMaxLoginAttemptToggle}
                checked={customMaxLoginAttemptsEnabled}
                label={I18n.t('Customize maximum login attempts (default 10 attempts)')}
                data-testid="customMaxLoginAttemptsCheckbox"
              />
              <View
                as="div"
                insetInlineStart="1.75em"
                position="relative"
                margin="xx-small small xxx-small 0"
              >
                <Text size="small">
                  {I18n.t(
                    'This option controls the number of attempts a single user can make consecutively to login without success before their user’s login is suspended. Users can be unsuspended by institutional admins. Cannot be higher than 20 attempts.'
                  )}
                </Text>
              </View>
            </View>
            <View as="div" maxWidth="9rem" margin="0 medium medium medium">
              <View as="div" margin="0 medium medium medium">
                <NumberInputControlled
                  minimum={3}
                  maximum={20}
                  currentValue={maxLoginAttempts}
                  updateCurrentValue={handleMaxLoginAttemptsChange}
                  disabled={!customMaxLoginAttemptsEnabled}
                  data-testid="customMaxLoginAttemptsInput"
                />
              </View>
            </View>
            <View as="div" margin="medium medium small medium">
              <Checkbox
                onChange={handleAllowLoginSuspensionToggle}
                checked={allowLoginSuspensionEnabled}
                label={I18n.t('Allow login suspension')}
                data-testid="allowLoginSuspensionCheckbox"
              />
            </View>
          </Flex.Item>

          <Flex.Item as="footer">
            <View as="div" background="secondary" width="100%" textAlign="end">
              <View as="div" display="inline-block">
                <Button
                  margin="small 0"
                  color="secondary"
                  onClick={() => setShowTray(false)}
                  data-testid="cancelButton"
                >
                  {I18n.t('Cancel')}
                </Button>
                <Button
                  margin="small"
                  color="primary"
                  onClick={saveChanges}
                  disabled={!enableApplyButton}
                  data-testid="saveButton"
                >
                  {I18n.t('Apply')}
                </Button>
              </View>
            </View>
          </Flex.Item>
        </Flex>
      </Tray>

      <ForbiddenWordsFileUpload
        open={fileModalOpen}
        onDismiss={handleCancelUploadModal}
        onSave={() => {
          setFileModalOpen(false)
          fetchAndSetForbiddenWords()
        }}
        forbiddenWordsUrl={forbiddenWordsUrl}
        setForbiddenWordsUrl={setForbiddenWordsUrl}
        forbiddenWordsFilename={forbiddenWordsFilename}
        setForbiddenWordsFilename={setForbiddenWordsFilename}
      />
    </>
  )
}

export default PasswordComplexityConfiguration
