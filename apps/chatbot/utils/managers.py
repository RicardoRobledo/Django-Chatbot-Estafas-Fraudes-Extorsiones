from string import Template
from datetime import datetime

from django.conf import settings


__author__ = 'Ricardo Robledo'
__version__ = '1.0'


class PromptManager():

    @classmethod
    async def read_prompt(cls, prompt_file: str):
        """
        This method read a file and return a prompt template

        :param prompt_file: file name to make the prompt
        """

        import aiofiles

        async with aiofiles.open(f'apps/chatbot/prompts/{prompt_file}.txt') as file:
            file_content = await file.read()

        return file_content

    @classmethod
    def fill_out_prompt(cls, prompt: str, variables: dict):
        """
        This method fill out a prompt template

        :return: prompt filled out
        """

        return Template(prompt).substitute(**variables)
