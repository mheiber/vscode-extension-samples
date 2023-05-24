/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import * as fs from 'fs';
import { workspace, ExtensionContext, CodeAction, WorkspaceEdit } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,

} from 'vscode-languageclient/node';
import {
	commands
} from 'vscode'

const date = new Date();
const logFile = `/tmp/log-${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;

function log(s: string): void {
	fs.appendFileSync(logFile, s + '\n');
}

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};
	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		},
		middleware: {
			async resolveCodeAction(rawAction, token, next): Promise<CodeAction | null | undefined> {
				log('resolveCodeAction');
				const action = await next(rawAction, token);
				action.edit = new WorkspaceEdit();
				action.command = {
					command: commandName,
					title: action.title,
					arguments: [],
				}
				return action;
			}
		}
	};

	log('client init')

	// Create the language client and start the client.
	const client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	const commandName = `my-command-${Math.random()}-${Math.random()}`

	commands.registerCommand(commandName, async () => {
		log('running command');
	});


	log('client start')

	// Start the client. This will also launch the server
	client.start();
}
