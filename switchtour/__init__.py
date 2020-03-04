import os
import logging
import re
log = logging.getLogger(__name__)

class Switchtour(object):
    def __init__(this, trans):
        this.trans = trans
        this.user = this.trans.get_user()
        this.history = this.trans.get_history()
        this.history_id = this.trans.app.security.encode_id(this.history.id)
        this.bibtex = ''
        this.workflow = ''
        this.commands = ''

    def get_user(this):
        from galaxy.managers.users import UserManager
        print("-------------------------")
        return {
            'name': this.user.username,
            'isadmin': UserManager(this.trans.app).is_admin(this.user)
        }

    def update_tours(this):
        from galaxy.managers.users import UserManager
        if UserManager(this.trans.app).is_admin(this.user):
            this.trans.app.tour_registry.load_tours()
        
    def new_history(this):
        from galaxy.managers.histories import HistoryManager
        
        for h in HistoryManager(this.trans.app).by_user(this.user):
            if h.name == 'de.STAIR Guide History (non-persistent!)':
                HistoryManager(this.trans.app).purge(h)
        this.trans.set_history(this.trans.new_history(name='de.STAIR Guide History (non-persistent!)'))

    def get_all(this):
        this.get_commands()
        this.get_workflow()
        this.get_bibtex()

        return {
            'commands': this.commands,
            'workflow': this.workflow,
            'bibtex': this.bibtex
        }

    def get_commands(this):
        for e in this.history.contents_iter():
            if e.creating_job.tool_id == 'upload1' or e.creating_job.any_output_dataset_deleted is True or e.creating_job.any_output_dataset_collection_instances_deleted is True:
                continue

            if e.creating_job.exit_code == 'none' or e.creating_job.exit_code == 0:
                this.commands = this.commands + "\n" + e.creating_job.command_line if this.commands else e.creating_job.command_line

        return {
            'commands': this.commands
        }


    def get_workflow(this):
        from galaxy import util
        from galaxy.webapps.galaxy.controllers.workflow import WorkflowController
        from galaxy.workflow.extract import extract_workflow
        from galaxy.workflow.extract import summarize
                
        tmpuser = this.user
        if not this.user:
            #tmpuser = UserManager(this.trans.app).admins()[0]
            tmpusername = os.getenv('GALAXY_DEFAULT_WORKFLOWGENERATOR_USER', os.environ['GALAXY_DEFAULT_ADMIN_USER'])
            tmpuser = this.trans.sa_session.query(this.trans.app.model.User).filter_by(username=tmpusername,deleted=False).all()[0]

        #html = WorkflowController(this.trans.app).build_from_current_history(this.trans)
        #use reimplementation since controller does user=trans.get_user() || error

        jobs, warnings = summarize(this.trans)
        html = this.trans.fill_template("workflow/build_from_current_history.mako", jobs=jobs, warnings=warnings, history=this.history)
        
        job_ids = re.findall('job_ids.+value="([^"]+)',html)
        dataset_ids = re.findall('dataset_ids.+value="([^"]+)',html)
        dataset_names = re.findall('dataset_names.+value="([^"]+)',html)
        dataset_collection_ids = re.findall('dataset_collection_ids.+value="(\d+)',html)
        dataset_collection_names = re.findall('dataset_collection_names.+value="(\d+)',html)

        #w = WorkflowController(this.trans.app).build_from_current_history(this.trans,job_ids=job_ids,dataset_ids=dataset_ids,dataset_collection_ids=dataset_collection_ids, workflow_name='test', dataset_names=dataset_names, dataset_collection_names=dataset_collection_names)
        # use reimplementation again
      
        dataset_names = util.listify(dataset_names)
        dataset_collection_names = util.listify(dataset_collection_names)
        stored = extract_workflow(
            this.trans,
            user=tmpuser,
            job_ids=job_ids,
            dataset_ids=dataset_ids,
            dataset_collection_ids=dataset_collection_ids,
            workflow_name='de.STAIR Guide Workflow',
            dataset_names=dataset_names,
            dataset_collection_names=dataset_collection_names
        )
        #workflow_id = this.trans.security.encode_id(stored.id)

        this.workflow = WorkflowController(this.trans.app)._workflow_to_dict(this.trans, stored)

        # reimplement deletion which originally makes use of get_stored_workflow which failes in case of anon user
        stored.deleted = True
        tmpuser.stored_workflow_menu_entries = [entry for entry in tmpuser.stored_workflow_menu_entries if entry.stored_workflow != stored]
        this.trans.sa_session.add(stored)
        this.trans.sa_session.flush()

        return {
            'workflow': this.workflow
        }


    def get_bibtex(this):
        from galaxy.managers.citations import CitationsManager
        
        citations = []
        for e in this.history.contents_iter():
            if e.creating_job.any_output_dataset_deleted is True or e.creating_job.any_output_dataset_collection_instances_deleted is True:
                continue

            b = CitationsManager(this.trans.app).citations_for_tool_ids([e.creating_job.tool_id])
            
            if b:
                bib = b[0].to_bibtex()
                if b[0].has_doi and re.search(r'title\s*=\s*\{.+', bib) is None:
                    try:
                        if isinstance(b[0], DoiCitation):
                            tmp = CitationsManager(this.trans.app).doi_cache.get_bibtex(b[0].doi())
                            bib = tmp
                        else:
                            doi = re.search(r'doi\s*=\s*\{(.+)\}', b).group(1)
                            tmp = CitationsManager(this.trans.app).doi_cache.get_bibtex(doi)
                            bib = tmp
                    except:
                        pass

                bib = bib.lstrip()
                if not bib in citations:
                    citations.append(bib)
                    this.bibtex = this.bibtex + "\n\n" + bib

        return {
            'bibtex': this.bibtex
        }

def main(trans, webhook, params):

    error = ''

    try:
        switchtour = Switchtour(trans)

        if params['fun']:
            function = getattr(switchtour,params['fun'])
            return {'success': not error, 'error': error, 'data': function()}

    except Exception as e:
        error = str(e)
        log.exception(e)

    return {'success': not error, 'error': error}
