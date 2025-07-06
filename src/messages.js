function createFormLinkMessage(
  link,
  prefix = '',
  text = '以下のフォームから情報を入力してください。',
  buttonLabel = 'フォームを開く'
) {
  return {
    type: 'template',
    altText: 'お客様サポートフォーム',
    template: {
      type: 'buttons',
      text: [prefix, text].filter(Boolean).join('\n'),
      actions: [
        { type: 'uri', label: buttonLabel, uri: link }
      ]
    }
  };
}

export { createFormLinkMessage };
