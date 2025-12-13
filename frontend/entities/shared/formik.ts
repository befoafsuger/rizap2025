import { useFormik, type FormikValues } from 'formik'

export type FormikReturnType<T extends FormikValues> = ReturnType<
  typeof useFormik<T>
>
