function createFormLinkMessage(link, prefix = '') {
  return {
    type: 'template',
    altText: 'お客様サポートフォーム',
    template: {
      type: 'buttons',
      text: `${prefix}\n以下のフォームから情報を入力してください。`,
      actions: [
        { type: 'uri', label: 'フォームを開く', uri: link }
      ]
    }
  };
}

module.exports = { createFormLinkMessage };
