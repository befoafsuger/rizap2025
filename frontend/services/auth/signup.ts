import { useFormik } from 'formik'
import * as Yup from 'yup'
import { supabase } from '../database/supabase'
import { useState } from 'react'
import { useCreateUser } from './create-user'
import { FormikReturnType } from '@/entities/shared/formik'

interface FormValues {
  displayName: string
  email: string
  password: string
}

interface UseSignUp {
  formik: FormikReturnType<FormValues>
  loading: boolean
}

export function useSignUp(): UseSignUp {
  const [loading, setLoading] = useState(false)
  const { trigger: createUser, isMutating } = useCreateUser()

  const formik = useFormik<FormValues>({
    initialValues: {
      displayName: '',
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      displayName: Yup.string().required('表示名は必須です'),
      email: Yup.string()
        .email('メールアドレスが無効です')
        .required('メールアドレスは必須です'),
      password: Yup.string().required('パスワードは必須です'),
    }),
    onSubmit: async (values) => {
      setLoading(true)
      try {
        // 1: ユーザーを認証する (Supabase Auth)
        const {
          error: authError,
          data: { user, session },
        } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
        })

        if (authError || !user) {
          console.error('認証エラー:', authError)
          formik.setFieldError(
            'email',
            authError?.message || '認証に失敗しました'
          )
          return
        }

        // 2. セッションからアクセストークンを取得
        // signUp直後はsessionがnullの場合があるので、明示的に取得
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession()
        const accessToken =
          currentSession?.access_token || session?.access_token

        if (!accessToken) {
          console.error('アクセストークンが取得できませんでした')
          formik.setFieldError('email', 'セッションの取得に失敗しました')
          return
        }

        // 3. バックエンドAPI経由でusersテーブルにユーザーを作成
        await createUser({
          userId: user.id,
          displayName: values.displayName,
          accessToken,
        })
      } catch (error) {
        console.error('ユーザー作成エラー:', error)
        formik.setFieldError('email', 'ユーザーの作成に失敗しました')
      } finally {
        setLoading(false)
      }
    },
  })

  return {
    formik,
    loading: loading || isMutating,
  }
}
