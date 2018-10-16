import logging
from io import StringIO
import tempfile

log = logging.getLogger(__name__)

def main(trans, webhook):

    error = ''
    try:
        from xml.etree import ElementTree
        from bioblend import galaxy
        from galaxy.managers import api_keys
        from galaxy.webapps.galaxy.controllers.history import HistoryController
        from galaxy.webapps.galaxy.controllers.workflow import WorkflowController
        from galaxy.managers.histories import HistoryManager
        # from galaxy.managers.datasets import DatasetManager
        # from galaxy.webapps.galaxy.api.datasets import DatasetsController
        from galaxy.model import Dataset
        # from galaxy.managers.workflows import WorkflowsManager
    except ImportError as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    try:
        apikey = api_keys.ApiKeyManager(trans.app).get_or_create_api_key(trans.user)
        gi = ''
        try:
            gi = galaxy.GalaxyInstance(url='http://127.0.0.1:80', key=apikey)
            gi.workflows.get_workflows()
        except Exception:
            gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)

        #t = trans.app.toolbox.get_tool('destair_heatmap')
        for n,t in filter(lambda (n,t): n == 'destair_heatmap', trans.app.toolbox.tools_by_id.iteritems()):
            for n,p in filter(lambda (n,p): n == 'input_topx', t.inputs.items()):
                print p.name #refresh_on_change    sanitizer    to_python
                #print dir(p)

            t.check_and_update_param_values({'input_topx':33},trans)

            #return {'success': not error, 'error': error}

            tree = ElementTree.parse(t.config_file) #tools/destair_heatmap/destair_heatmap.xml'
            for p in tree.getroot().iter('param'):
                if p.get('name') == "input_topx":
                    p.set('value','20')
            
            f = tempfile.NamedTemporaryFile(delete=False)
            #print f.name
            tree.write(f.name)
            f.seek(0)
            #from galaxy.tools import ToolBox
            #ToolBox(trans.app).register_tool(trans.app.toolbox.load_tool(f.name, use_cached=False))
            trans.app.toolbox.register_tool(trans.app.toolbox.load_tool(f.name, use_cached=False))
            f.unlink            

        return {'success': not error, 'error': error}

    except Exception as e:
        error = str(e)
        print(error)
        return {'success': not error, 'error': error}

    return {'success': not error, 'error': error}
