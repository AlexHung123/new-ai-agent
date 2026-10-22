/** iTMS WCMS TinyMCE schema — keep in sync with itms-frontend ControlledTinyMCE. */
export const WCMS_TINYMCE_INIT = {
  promotion: false,
  height: 360,
  menubar: true,
  relative_urls: false,
  convert_urls: false,
  remove_script_host: false,
  sandbox_iframes: false,
  extended_valid_elements:
    'meta[*],link[*],style[*],script[*],button[*],iframe[*],div[*],span[*],p[*],input[*],a[*],img[*],li[*],i[*],svg[*],video[*]',
  extended_valid_children:
    '+p[script|iframe],+iframe[script|meta|link|script|button],+body[style|meta|link|script|button|iframe],+div[h2|span|meta|object|link|script|button|iframe]',
  valid_children:
    '+p[script|iframe],+iframe[script|meta|link|script|button],+body[style|meta|link|script|button|iframe],+div[h2|span|meta|object|link|script|button|iframe]',
  plugins:
    'preview directionality visualblocks visualchars image link code codesample charmap pagebreak insertdatetime advlist lists help table',
  content_style:
    'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
} as const;

export const HTML_PREVIEW_SANDBOX = 'allow-scripts allow-downloads';
