import logging

log = logging.getLogger(__name__)

def main(trans, webhook):

	error = ''
	try:
		from bioblend import galaxy
		import cStringIO
	except ImportError as e:
		error = str(e)
		print(error)
		return {'success': not error, 'error': error}

	workflow = ''
	lasttool = ''
	try:

		for i in trans.user.api_keys:
			apikey = i.key
			print(i.key)
                        break
		
		has_hastories = False
		for i in trans.user.active_histories:
			has_hastories = True
			print(dir(i))
			print(i.to_dict())
			for c in i.contents_iter():
				print(dir(c))
				print(c.to_dict())
				lasttool = c.name
                        break
		print("========================")
		for i in trans.sa_session.query(trans.app.model.APIKeys):
			print(i.id)
			print(i.user.username)
			print(i.user.email)
			print(i.key)

		print("========================")
		
		if has_hastories :
			gi = galaxy.GalaxyInstance(url='http://127.0.0.1:8080', key=apikey)
			history = gi.histories.get_most_recently_used_history()
			jeha_id = gi.histories.export_history(history['id'], gzip=False, include_hidden=False, include_deleted=False, wait=True)
                        download = cStringIO.StringIO()
			gi.histories.download_history(history['id'], jeha_id, download, chunk_size=4096)
                        workflow = download.getvalue()

		if has_hastories and lasttool == 'nuke':
			for i in gi.histories.get_histories():
				gi.i.delete_history(i['id'], purge=True)
                	for i in gi.workflows.get_workflows():
                        	gi.i.delete_workflow(i['id'])
	
	except Exception as e:
		error = str(e)
		print(error)
	return {'success': not error, 'error': error, 'lasttour': lasttool, 'workflow': workflow}

