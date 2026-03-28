/// <reference lib="webworker" />

interface DocxParseRequest {
  requestId: string;
  buffer: ArrayBuffer;
}

interface DocxParseSuccess {
  requestId: string;
  ok: true;
  text: string;
}

interface DocxParseFailure {
  requestId: string;
  ok: false;
  error: string;
}

type DocxParseResponse = DocxParseSuccess | DocxParseFailure;

self.onmessage = async (event: MessageEvent<DocxParseRequest>) => {
  const { requestId, buffer } = event.data || {};
  if (!requestId || !(buffer instanceof ArrayBuffer)) {
    const invalidMessage: DocxParseFailure = {
      requestId: String(requestId || ''),
      ok: false,
      error: 'Yêu cầu parse DOCX không hợp lệ.',
    };
    self.postMessage(invalidMessage);
    return;
  }

  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    const response: DocxParseSuccess = {
      requestId,
      ok: true,
      text: String(result?.value || ''),
    };
    self.postMessage(response);
  } catch (error) {
    const response: DocxParseFailure = {
      requestId,
      ok: false,
      error: error instanceof Error ? error.message : 'Không thể parse DOCX trong worker.',
    };
    self.postMessage(response);
  }
};

export {};
