type BaseUIConfigField = {
  name: string;
  key: string;
  required: boolean;
  description: string;
  scope: 'client' | 'server';
  env?: string;
};

type StringUIConfigField = BaseUIConfigField & {
  type: 'string';
  placeholder?: string;
  default?: string;
};

type SelectUIConfigFieldOptions = {
  name: string;
  value: string;
};

type SelectUIConfigField = BaseUIConfigField & {
  type: 'select';
  default?: string;
  options: SelectUIConfigFieldOptions[];
};

type PasswordUIConfigField = BaseUIConfigField & {
  type: 'password';
  placeholder?: string;
  default?: string;
};

type TextareaUIConfigField = BaseUIConfigField & {
  type: 'textarea';
  placeholder?: string;
  default?: string;
};

type SwitchUIConfigField = BaseUIConfigField & {
  type: 'switch';
  default?: boolean;
};

type UIConfigField =
  | StringUIConfigField
  | SelectUIConfigField
  | PasswordUIConfigField
  | TextareaUIConfigField
  | SwitchUIConfigField;

type Config = {
  version: number;
  preferences: {
    [key: string]: any;
  };
  personalization: {
    [key: string]: any;
  };
  [key: string]: any;
};

type UIConfigSections = {
  preferences: UIConfigField[];
  personalization: UIConfigField[];
};

export type {
  UIConfigField,
  Config,
  UIConfigSections,
  SelectUIConfigField,
  StringUIConfigField,
  TextareaUIConfigField,
  SwitchUIConfigField,
};
