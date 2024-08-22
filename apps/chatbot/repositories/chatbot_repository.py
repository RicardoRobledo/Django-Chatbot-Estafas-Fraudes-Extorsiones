import base64

from ...desing_patterns.creational_patterns.singleton.openai_singleton import OpenAISingleton
from ...desing_patterns.creational_patterns.singleton.chromadb_singleton import ChromaSingleton
from ..utils.managers import PromptManager


async def send_message(thread_id: str, message: str):

    documents = ChromaSingleton.search_similarity_procedure(message)

    # Making prompt
    prompt = await PromptManager.read_prompt('prompt_message')
    prompt_result = PromptManager.fill_out_prompt(prompt, {'message': message, 'documents': str.join('\n------------------\n', [
                                                  document.page_content for document in documents])})

    # Sending prompt message
    await OpenAISingleton.create_message(thread_id, prompt_result)
    run = await OpenAISingleton.run_thread(thread_id)

    # Getting answer
    return await OpenAISingleton.retrieve_message(run, thread_id)


async def send_voice_message(thread_id: str, message: str):

    documents = ChromaSingleton.search_similarity_procedure(message)

    # Making prompt
    prompt = await PromptManager.read_prompt('prompt_message')
    prompt_result = PromptManager.fill_out_prompt(prompt, {'message': message, 'documents': str.join('\n------------------\n', [
                                                  document.page_content for document in documents])})

    # Sending prompt message
    await OpenAISingleton.create_message(thread_id, prompt_result)
    run = await OpenAISingleton.run_thread(thread_id)

    if run.status == "completed":

        # Getting voice message
        voice_response = await OpenAISingleton.get_text_to_speech(run, thread_id)
        message = await OpenAISingleton.retrieve_message(run, thread_id)
        voice_response_encoded = base64.b64encode(
            voice_response.response.read()).decode('utf-8')
        message['data']['voice_response'] = voice_response_encoded

        return message

    else:

        # Getting answer
        return await OpenAISingleton.retrieve_message(run, thread_id)
