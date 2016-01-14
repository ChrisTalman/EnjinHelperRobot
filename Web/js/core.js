'use strict';

document.addEventListener('DOMContentLoaded', onDocumentLoaded);
document.addEventListener('load', onDocumentLoaded);

function onDocumentLoaded()
{
	console.log('Document loaded!');
	showMemberAssociations();
	var memberAssociationsRequest = new Request('/api', 'POST', {command: 'getMemberAssociations'});
	memberAssociationsRequest.api.onload = function()
	{
		console.log(memberAssociationsRequest.json);
		var memberAssociations = memberAssociationsRequest.json;
		var tableMemberAssociations = document.getElementById('tableMemberAssociations');
		for (var memberAssociationIndex = 0; memberAssociationIndex < memberAssociations.length; memberAssociationIndex++)
		{
			var memberAssociation = memberAssociations[memberAssociationIndex];
			var newRow = document.createElement('tr');
			newRow.innerHTML += '<td>' + memberAssociation.discordUsername + ' <span>(' + memberAssociation.discordMemberID + ')</span></td>';
			newRow.innerHTML += '<td>' + memberAssociation.enjinUsername + ' <span>(' + memberAssociation.enjinUserID + ')</span></td>';
			tableMemberAssociations.appendChild(newRow);
		};
	};
	var roleAssociationsRequest = new Request('/api', 'POST', {command: 'getRoleAssociations'});
	roleAssociationsRequest.api.onload = function()
	{
		console.log(roleAssociationsRequest.json);
		var roleAssociations = roleAssociationsRequest.json;
		var tableRoleAssociations = document.getElementById('tableRoleAssociations');
		for (var roleAssociationIndex = 0; roleAssociationIndex < roleAssociations.length; roleAssociationIndex++)
		{
			var roleAssociation = roleAssociations[roleAssociationIndex];
			var newRow = document.createElement('tr');
			newRow.innerHTML += '<td>' + roleAssociation.discordRoleName + ' <span>(' + roleAssociation.discordRoleID + ')</span></td>';
			newRow.innerHTML += '<td>' + roleAssociation.enjinTagName + ' <span>(' + roleAssociation.enjinTagID + ')</span></td>';
			tableRoleAssociations.appendChild(newRow);
		};
	};
};

function showMemberAssociations()
{
	document.getElementById('tableMemberAssociations').style.display = 'block';
	document.getElementById('tableRoleAssociations').style.display = 'none';
};

function showRoleAssociations()
{
	document.getElementById('tableMemberAssociations').style.display = 'none';
	document.getElementById('tableRoleAssociations').style.display = 'block';
};