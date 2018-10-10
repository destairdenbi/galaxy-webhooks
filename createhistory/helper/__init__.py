import logging
# import json

log = logging.getLogger(__name__)

def main(trans, webhook):
    error = ''
    try:
    #     from bioblend import galaxy
        from galaxy.managers import api_keys
    #     from galaxy.webapps.galaxy.api.histories import HistoriesController
    #     from galaxy.webapps.galaxy.controllers.history import HistoryController
    #     from galaxy.webapps.galaxy.controllers.root import RootController
    #     from galaxy.managers.histories import HistoryManager
    except ImportError as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    try:
        apikey = api_keys.ApiKeyManager(trans.app).get_or_create_api_key(trans.user)
        # gi = ''
        # url = 'http://127.0.0.1:80'
        # try:
        #     gi = galaxy.GalaxyInstance(url=url, key=apikey)
        #     gi.workflows.get_workflows()
        # except Exception:
        #     url = 'http://127.0.0.1:8080' 
        #     gi = galaxy.GalaxyInstance(url=url, key=apikey)

        # h = gi.histories.create_history(name="de.STAIR workflow generator")
        # gi.make_put_request(url + '/api/histories/' + h['id'] + '/set_as_current') # ?
        trans.set_history(trans.new_history(name='de.STAIR workflow generator'))
        #RootController(trans.app).history_new(trans, name='de.STAIR workflow generator') # create and switch to
        #h = json.loads(HistoriesController(trans.app).create(trans, {'name': 'de.STAIR workflow generator'}))
        #h = json.loads(HistoryController(trans.app).create_new_current(trans, name='de.STAIR workflow generator'))
        #HistoryController(trans.app).switch_to_history(trans, h['id'])

    except Exception as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    return {'success': not error, 'error': error}
