import logging
log = logging.getLogger(__name__)

def main(trans, webhook, params):

    error = ''
    try:
        from galaxy.managers import api_keys
        from galaxy.webapps.galaxy.api.workflows import WorkflowsAPIController
        from galaxy.webapps.galaxy.controllers.workflow import WorkflowController
        from galaxy.managers.citations import CitationsManager
    except ImportError as e:
        error = str(e)
        log.exception(e)

    return {'success': not error, 'error': error, 'lasttool': ''}
