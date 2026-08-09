export async function askAssistant(question = '') {
  return {
    ok: true,
    answer: `Assistant V21: réponse simulée pour "${question}".`
  };
}
